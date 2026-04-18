'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  runModel,
  calculateStampDuty,
  DEFAULT_ASSUMPTIONS,
  type UserInputs,
  type Assumptions,
  type Region,
} from '@/lib/model';
import { useAnimatedNumber } from '@/lib/useAnimatedNumber';
import {
  type ScenarioState,
  DEFAULT_SCENARIO,
  encodeScenario,
  decodeScenario,
} from '@/lib/urlState';
import { useAuth } from '@/lib/auth';
import { AccountDialog } from '@/components/AccountDialog';
import { ShareDialog } from '@/components/ShareDialog';

// ---------- Formatters ----------

const formatGbp = (n: number): string =>
  '£' + Math.round(n).toLocaleString('en-GB');

const formatGbpCompact = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return '£' + (n / 1_000_000).toFixed(2) + 'M';
  if (abs >= 10_000) return '£' + Math.round(n / 1_000) + 'k';
  if (abs >= 1_000) return '£' + (n / 1_000).toFixed(1) + 'k';
  return '£' + Math.round(n);
};

const formatPct = (n: number): string => (n * 100).toFixed(1) + '%';

// ---------- Small components ----------

function AnimatedGbp({ value, className }: { value: number; className?: string }) {
  const animated = useAnimatedNumber(value, 550);
  return <span className={className}>{formatGbp(animated)}</span>;
}

function AnimatedGbpCompact({ value, className }: { value: number; className?: string }) {
  const animated = useAnimatedNumber(value, 550);
  return <span className={className}>{formatGbpCompact(animated)}</span>;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <div className="py-3 border-b border-[var(--rule)] last:border-b-0">
      <div className="flex items-baseline justify-between mb-2.5">
        <label className="text-[13px] text-[var(--ink-muted)]">{label}</label>
        <span className="text-[13px] font-medium font-mono-num text-[var(--ink)]">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = 1000,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="eyebrow block mb-2">{label}</span>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--ink-subtle)] pointer-events-none font-mono-num">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          style={{
            paddingLeft: prefix ? '26px' : undefined,
            paddingRight: suffix ? '36px' : undefined,
          }}
          className="font-mono-num"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--ink-subtle)] pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function ActionButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-[13px] text-[var(--ink-muted)] hover:text-[var(--ink)] underline underline-offset-4 decoration-[var(--rule)] hover:decoration-[var(--ink)] transition-colors"
    >
      {children}
    </button>
  );
}

// ---------- Main ----------

export default function Home() {
  // Single scenario state object, so we can atomically replace it from URL or saved scenarios
  const [state, setState] = useState<ScenarioState>(DEFAULT_SCENARIO);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const search = window.location.search;
    if (search) {
      const fromUrl = decodeScenario(search);
      setState(fromUrl);
    }
    setHydrated(true);
  }, []);

  // Keep URL in sync with state after hydration (without page reloads)
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    const qs = encodeScenario(state);
    const newUrl = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [state, hydrated]);

  // Dialog state
  const [accountOpen, setAccountOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const { user, configured: authConfigured } = useAuth();

  // Stamp duty auto-calc
  const autoStampDuty = useMemo(
    () =>
      calculateStampDuty(state.housePrice, state.region, {
        firstTimeBuyer: state.firstTimeBuyer,
        additionalHome: state.additionalHome,
      }),
    [state.housePrice, state.region, state.firstTimeBuyer, state.additionalHome]
  );
  const effectiveStampDuty = state.stampDutyOverride ?? autoStampDuty;

  // Helpers to update single fields
  const update = <K extends keyof ScenarioState>(key: K, value: ScenarioState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const resetStampDuty = () => update('stampDutyOverride', null);

  // Assembling the inputs & assumptions
  const inputs: UserInputs = {
    housePrice: state.housePrice,
    deposit: state.deposit,
    termYears: state.termYears,
    initialRate: state.initialRate,
    fixYears: state.fixYears,
    monthlyRent: state.monthlyRent,
  };

  const assumptions: Assumptions = useMemo(
    () => ({
      ...DEFAULT_ASSUMPTIONS,
      houseGrowth: state.houseGrowth,
      investmentReturn: state.investmentReturn,
      rentInflation: state.rentInflation,
      postFixRate: state.postFixRate,
      annualMaintenance: state.annualMaintenance,
      stampDuty: effectiveStampDuty,
    }),
    [state, effectiveStampDuty]
  );

  const result = useMemo(() => runModel(inputs, assumptions), [inputs, assumptions]);

  const chartData = useMemo(() => {
    return [
      {
        year: 0,
        buyer: state.deposit,
        renter: state.deposit + effectiveStampDuty + assumptions.upfrontFees,
      },
      ...result.yearly.map((y) => ({
        year: y.year,
        buyer: y.buyerEquity,
        renter: y.renterPortfolio,
      })),
    ];
  }, [result, state.deposit, effectiveStampDuty, assumptions.upfrontFees]);

  const { summary } = result;
  const winnerLabel =
    summary.winner === 'tied'
      ? 'the outcomes are roughly level'
      : summary.winner === 'buyer'
        ? 'buying comes out ahead'
        : 'renting and investing comes out ahead';

  const handleLoadScenario = (loaded: ScenarioState) => {
    setState(loaded);
  };

  return (
    <main className="min-h-screen">
      {/* ---------- Top strip ---------- */}
      <div className="border-b border-[var(--rule)] bg-[var(--paper)] print:hidden">
        <div className="max-w-[1200px] mx-auto px-8 py-5 flex items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-6">
            <a
              href="/"
              className="font-display text-lg tracking-tight hover:text-[var(--ink-muted)] transition-colors"
            >
              Rent vs Buy
            </a>
            <span className="eyebrow hidden sm:inline">A long-term calculator</span>
          </div>
          <div className="flex items-baseline gap-5 text-[13px]">
            <ActionButton onClick={() => setShareOpen(true)}>Share</ActionButton>
            {hydrated && authConfigured && (
              <ActionButton onClick={() => setAccountOpen(true)}>
                {user ? 'Saved' : 'Sign in'}
              </ActionButton>
            )}
            <ActionButton onClick={() => window.print()}>Print</ActionButton>
          </div>
        </div>
      </div>

      {/* ---------- Print-only header ---------- */}
      <div className="hidden print:block mb-8 pb-4 border-b border-[var(--rule-strong)]">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-xl tracking-tight">Rent vs Buy</span>
          <span className="eyebrow">
            {new Date().toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* ---------- Hero ---------- */}
      <section className="max-w-[1200px] mx-auto px-8 pt-16 pb-12 print:pt-0 print:pb-6 print:px-0">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-7 animate-fade-up">
            <div className="eyebrow mb-6">The headline</div>
            <h1 className="font-display text-[44px] md:text-[58px] leading-[1.02] tracking-tight text-[var(--ink)] mb-2 print:text-[36px]">
              Over {state.termYears} years,{' '}
              <span className="italic">{winnerLabel}</span>.
            </h1>
          </div>

          <div className="md:col-span-5 animate-fade-up stagger-1">
            <div className="eyebrow mb-6">By this much</div>
            <div className="font-display text-[56px] md:text-[72px] leading-none tracking-tight font-serif-num print:text-[48px]">
              <AnimatedGbpCompact value={Math.abs(summary.difference)} />
            </div>
            <div className="mt-3 text-[13px] text-[var(--ink-muted)] leading-relaxed max-w-xs">
              Based on your inputs and the assumptions you&apos;ve chosen.
            </div>
          </div>
        </div>

        <div className="h-px bg-[var(--rule-strong)] mt-12 animate-draw-rule stagger-2 print:mt-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-16 mt-8">
          <div className="py-5 md:py-0 animate-fade-up stagger-2">
            <div className="eyebrow mb-3">If you buy</div>
            <div className="font-display text-[36px] md:text-[44px] leading-none tracking-tight font-serif-num mb-2">
              <AnimatedGbp value={summary.buyerEquityHeld} />
            </div>
            <div className="text-[13px] text-[var(--ink-muted)]">
              Net equity at year {state.termYears}. The house, with the mortgage paid off.
            </div>
          </div>
          <div className="py-5 md:py-0 animate-fade-up stagger-3 md:border-l md:border-[var(--rule)] md:pl-16">
            <div className="eyebrow mb-3">If you rent &amp; invest</div>
            <div className="font-display text-[36px] md:text-[44px] leading-none tracking-tight font-serif-num mb-2">
              <AnimatedGbp value={summary.renterNetWealth} />
            </div>
            <div className="text-[13px] text-[var(--ink-muted)]">
              Portfolio value at year {state.termYears}, after capital gains tax on non-ISA gains.
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Chart ---------- */}
      <section className="max-w-[1200px] mx-auto px-8 py-8 animate-fade-in stagger-3 print:px-0 print:py-4 print:break-inside-avoid">
        <div className="flex items-baseline justify-between mb-4">
          <div className="eyebrow">Wealth over time</div>
          <div className="flex items-center gap-6 text-[12px] text-[var(--ink-muted)]">
            <span className="flex items-center gap-2">
              <span
                className="block w-6 h-[2px]"
                style={{ background: 'var(--series-buyer)' }}
              />
              Buyer equity
            </span>
            <span className="flex items-center gap-2">
              <span
                className="block w-6 h-[2px]"
                style={{
                  background:
                    'repeating-linear-gradient(to right, var(--series-renter) 0 4px, transparent 4px 7px)',
                }}
              />
              Renter wealth
            </span>
          </div>
        </div>

        <div className="h-[340px] md:h-[400px] -ml-2 print:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="#d4cfc4" strokeDasharray="1 3" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: '#8a8a8a' }}
                axisLine={{ stroke: '#a8a29a' }}
                tickLine={{ stroke: '#a8a29a' }}
                tickMargin={8}
              />
              <YAxis
                tickFormatter={formatGbpCompact}
                tick={{ fontSize: 11, fill: '#8a8a8a' }}
                axisLine={false}
                tickLine={false}
                width={64}
              />
              <Tooltip
                formatter={(v: number, name: string) => [formatGbp(v), name]}
                labelFormatter={(l) => `Year ${l}`}
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--rule-strong)',
                  borderRadius: 2,
                  fontSize: 12,
                  padding: '10px 12px',
                }}
                labelStyle={{
                  color: 'var(--ink-subtle)',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 4,
                }}
                cursor={{ stroke: '#a8a29a', strokeDasharray: '2 2' }}
              />
              {state.fixYears > 0 && state.fixYears < state.termYears && (
                <ReferenceLine
                  x={state.fixYears}
                  stroke="#a8a29a"
                  strokeDasharray="2 4"
                  label={{
                    value: 'Fix ends',
                    position: 'top',
                    fill: '#8a8a8a',
                    fontSize: 10,
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="buyer"
                name="Buyer equity"
                stroke="var(--series-buyer)"
                strokeWidth={2}
                dot={false}
                isAnimationActive
                animationDuration={900}
              />
              <Line
                type="monotone"
                dataKey="renter"
                name="Renter wealth"
                stroke="var(--series-renter)"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                isAnimationActive
                animationDuration={900}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ---------- Controls ---------- */}
      <section className="max-w-[1200px] mx-auto px-8 py-8 mt-4 animate-fade-in stagger-4 print:mt-0 print:py-4 print:px-0 print:break-inside-avoid">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7">
            <div className="flex items-baseline gap-4 mb-6">
              <h2 className="font-display text-2xl tracking-tight">Your numbers</h2>
              <span className="text-[12px] text-[var(--ink-subtle)] print:hidden">
                The facts of your situation.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-5 mb-6">
              <InputField
                label="House price"
                value={state.housePrice}
                onChange={(v) => update('housePrice', v)}
                prefix="£"
              />
              <InputField
                label="Deposit"
                value={state.deposit}
                onChange={(v) => update('deposit', v)}
                prefix="£"
              />
              <InputField
                label="Mortgage rate"
                value={+(state.initialRate * 100).toFixed(2)}
                onChange={(v) => update('initialRate', v / 100)}
                suffix="%"
                step={0.1}
              />
              <InputField
                label="Fix length"
                value={state.fixYears}
                onChange={(v) => update('fixYears', v)}
                suffix="yrs"
                step={1}
              />
              <InputField
                label="Monthly rent"
                value={state.monthlyRent}
                onChange={(v) => update('monthlyRent', v)}
                prefix="£"
                step={50}
              />
              <InputField
                label="Mortgage term"
                value={state.termYears}
                onChange={(v) => update('termYears', v)}
                suffix="yrs"
                step={1}
              />
            </div>

            <div className="bg-[var(--surface-muted)] border border-[var(--rule)] rounded-sm p-5">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <div className="eyebrow mb-1">Stamp duty</div>
                  <div className="font-display text-2xl font-serif-num text-[var(--ink)]">
                    {formatGbp(effectiveStampDuty)}
                  </div>
                </div>
                {state.stampDutyOverride !== null && (
                  <button
                    onClick={resetStampDuty}
                    className="text-[12px] text-[var(--ink-muted)] hover:text-[var(--ink)] underline underline-offset-2 decoration-[var(--rule)] hover:decoration-[var(--ink)] transition print:hidden"
                  >
                    Reset to auto
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={state.firstTimeBuyer}
                      onChange={(e) => {
                        update('firstTimeBuyer', e.target.checked);
                        if (e.target.checked) update('additionalHome', false);
                        resetStampDuty();
                      }}
                    />
                    <span className="text-[var(--ink-muted)]">First-time buyer</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={state.additionalHome}
                      onChange={(e) => {
                        update('additionalHome', e.target.checked);
                        if (e.target.checked) update('firstTimeBuyer', false);
                        resetStampDuty();
                      }}
                    />
                    <span className="text-[var(--ink-muted)]">Additional home</span>
                  </label>
                </div>
                <div>
                  <label className="eyebrow block mb-2">Region</label>
                  <select
                    value={state.region}
                    onChange={(e) => {
                      update('region', e.target.value as Region);
                      resetStampDuty();
                    }}
                  >
                    <option value="england">England</option>
                    <option value="scotland">Scotland</option>
                    <option value="wales">Wales</option>
                    <option value="northern-ireland">Northern Ireland</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--rule)] print:hidden">
                <label className="eyebrow block mb-2">Or override</label>
                <input
                  type="number"
                  placeholder={`${formatGbp(autoStampDuty)} (auto)`}
                  value={state.stampDutyOverride ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    update('stampDutyOverride', v === '' ? null : parseFloat(v) || 0);
                  }}
                  className="font-mono-num"
                  step={500}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="flex items-baseline gap-4 mb-6">
              <h2 className="font-display text-2xl tracking-tight">Assumptions</h2>
              <span className="text-[12px] text-[var(--ink-subtle)] print:hidden">
                Your view of the future.
              </span>
            </div>

            <div className="bg-[var(--surface-muted)] border border-[var(--rule)] rounded-sm px-5 py-2">
              <Slider
                label="House price growth"
                value={state.houseGrowth}
                min={0}
                max={0.08}
                step={0.001}
                onChange={(v) => update('houseGrowth', v)}
                format={formatPct}
              />
              <Slider
                label="Investment return"
                value={state.investmentReturn}
                min={0}
                max={0.12}
                step={0.001}
                onChange={(v) => update('investmentReturn', v)}
                format={formatPct}
              />
              <Slider
                label="Rent inflation"
                value={state.rentInflation}
                min={0}
                max={0.06}
                step={0.001}
                onChange={(v) => update('rentInflation', v)}
                format={formatPct}
              />
              <Slider
                label="Mortgage rate after fix"
                value={state.postFixRate}
                min={0.02}
                max={0.08}
                step={0.001}
                onChange={(v) => update('postFixRate', v)}
                format={formatPct}
              />
              <Slider
                label="Annual maintenance"
                value={state.annualMaintenance}
                min={0}
                max={10_000}
                step={100}
                onChange={(v) => update('annualMaintenance', v)}
                format={formatGbp}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Breakdown ---------- */}
      <section className="max-w-[1200px] mx-auto px-8 py-8 mt-4 print:mt-0 print:py-4 print:px-0 print:break-inside-avoid">
        <div className="eyebrow mb-4">The detail</div>
        <h2 className="font-display text-2xl tracking-tight mb-6">Where the money goes</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
          <div>
            <div className="text-[13px] text-[var(--ink-muted)] mb-4 pb-3 border-b border-[var(--rule-strong)]">
              Buyer
            </div>
            <dl className="space-y-3 text-[14px]">
              <Row label={`House value at year ${state.termYears}`} value={formatGbp(summary.houseValueEnd)} />
              <Row label="Mortgage remaining" value={formatGbp(summary.mortgageBalanceEnd)} />
              <Row label="Total mortgage paid" value={formatGbp(summary.totalMortgagePaid)} />
              <Row label="Total maintenance &amp; insurance" value={formatGbp(summary.totalMaintenancePaid)} />
              <Row label="Stamp duty &amp; fees" value={formatGbp(effectiveStampDuty + assumptions.upfrontFees)} />
              <Row label="Net equity if sold" value={formatGbp(summary.buyerEquitySold)} subtle />
            </dl>
          </div>

          <div>
            <div className="text-[13px] text-[var(--ink-muted)] mb-4 pb-3 border-b border-[var(--rule-strong)]">
              Renter
            </div>
            <dl className="space-y-3 text-[14px]">
              <Row label="Total rent paid" value={formatGbp(summary.totalRentPaid)} />
              <Row label="ISA (tax-free)" value={formatGbp(summary.renterIsaEnd)} />
              <Row label="Taxable account before tax" value={formatGbp(summary.renterGiaEnd)} />
              <Row label="Capital gains tax paid" value={formatGbp(summary.renterCgtPaid)} />
              <Row label="Net wealth" value={formatGbp(summary.renterNetWealth)} subtle />
            </dl>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="max-w-[1200px] mx-auto px-8 py-12 mt-8 border-t border-[var(--rule)] print:mt-4 print:py-4 print:px-0">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4">
            <div className="eyebrow mb-3">How it works</div>
            <p className="text-[13px] text-[var(--ink-muted)] leading-[1.75]">
              The renter invests the buyer&apos;s deposit plus the saved stamp duty on day one,
              then invests the monthly difference between the buyer&apos;s total outgoings and
              their own rent. Investments go into an ISA first (tax-free), with any overflow in
              a general investment account. Each year, up to £20,000 is moved from the general
              account into the ISA to shield future gains.
            </p>
          </div>
          <div className="md:col-span-4">
            <div className="eyebrow mb-3">What&apos;s modelled</div>
            <p className="text-[13px] text-[var(--ink-muted)] leading-[1.75]">
              Stamp duty for all four UK regions, including first-time buyer relief and the
              additional-home surcharge. A full mortgage amortisation with initial fix and
              re-fix. House price growth, maintenance, and buildings insurance. Rent inflation.
              Monthly compounding on investments. Capital gains tax on taxable gains at exit.
            </p>
          </div>
          <div className="md:col-span-4">
            <div className="eyebrow mb-3">What isn&apos;t</div>
            <p className="text-[13px] text-[var(--ink-muted)] leading-[1.75]">
              The value of owning a home beyond the numbers: security of tenure, freedom to
              modify, the ability to pass it on. Rent shocks if a landlord sells. Income tax on
              dividends. Changes to ISA or CGT rules over 25 years. Major maintenance events.
              All figures are nominal, with no inflation adjustment applied to the outputs.
            </p>
          </div>
        </div>
      </footer>

      {/* ---------- Dialogs ---------- */}
      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} state={state} />
      {hydrated && authConfigured && (
        <AccountDialog
          open={accountOpen}
          onClose={() => setAccountOpen(false)}
          user={user}
          currentState={state}
          onLoadScenario={handleLoadScenario}
        />
      )}
    </main>
  );
}

function Row({
  label,
  value,
  subtle = false,
}: {
  label: string;
  value: string;
  subtle?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 ${subtle ? 'pt-2 border-t border-[var(--rule)]' : ''}`}
    >
      <dt className="text-[var(--ink-muted)]" dangerouslySetInnerHTML={{ __html: label }} />
      <dd className="font-mono-num text-[var(--ink)]">{value}</dd>
    </div>
  );
}
