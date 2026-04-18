import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Rent vs Buy: a long-term calculator for UK homebuyers',
  description:
    'Compare the 25-year financial outcome of buying a home versus renting and investing the difference. Proper stamp duty, a full mortgage schedule, and honest assumptions you can adjust.',
  openGraph: {
    title: 'Rent vs Buy',
    description:
      'Compare the 25-year financial outcome of buying a home versus renting and investing the difference.',
    type: 'website',
  },
};

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Rent vs Buy Calculator',
    description:
      'A long-term calculator for UK homebuyers comparing the 25-year financial outcome of buying a home versus renting and investing the difference.',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'GBP',
    },
    featureList: [
      'UK stamp duty calculation for England, Scotland, Wales, and Northern Ireland',
      'First-time buyer and additional-home rules',
      'Full mortgage amortisation with initial fix and re-fix',
      'ISA and taxable account modelling',
      'Capital gains tax on investment gains',
      'Adjustable assumptions',
      'Shareable scenario URLs',
      'Save scenarios with a free account',
      'Print to PDF',
    ],
  };

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ---------- Top strip ---------- */}
      <div className="border-b border-[var(--rule)] bg-[var(--paper)]">
        <div className="max-w-[1200px] mx-auto px-8 py-5 flex items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-6">
            <Link
              href="/"
              className="font-display text-lg tracking-tight hover:text-[var(--ink-muted)] transition-colors"
            >
              Rent vs Buy
            </Link>
            <span className="eyebrow hidden sm:inline">A long-term calculator</span>
          </div>
          <Link
            href="/calculator"
            className="text-[13px] text-[var(--ink-muted)] hover:text-[var(--ink)] underline underline-offset-4 decoration-[var(--rule)] hover:decoration-[var(--ink)] transition-colors"
          >
            Open the calculator
          </Link>
        </div>
      </div>

      {/* ---------- Hero ---------- */}
      <section className="max-w-[1200px] mx-auto px-8 pt-24 md:pt-32 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-10 md:col-start-2 animate-fade-up">
            <div className="eyebrow mb-8">A long-term calculator for UK homebuyers</div>
            <h1 className="font-display text-[44px] md:text-[72px] lg:text-[84px] leading-[1.02] tracking-tight text-[var(--ink)] mb-8">
              Renting isn&apos;t throwing money away.
              <br />
              <span className="italic text-[var(--ink-muted)]">
                Buying isn&apos;t always the answer.
              </span>
            </h1>
            <p className="font-display text-[20px] md:text-[22px] leading-[1.55] text-[var(--ink-muted)] max-w-2xl mb-10">
              Work out the actual financial difference between buying a home and renting while
              investing the money you would have spent on buying. Proper stamp duty, a full
              mortgage schedule, and honest assumptions you can adjust.
            </p>
            <Link
              href="/calculator"
              className="inline-flex items-center gap-3 py-3 px-6 border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] text-[14px] hover:bg-[var(--ink-muted)] hover:border-[var(--ink-muted)] transition-colors"
            >
              Open the calculator
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto">
        <div className="h-px bg-[var(--rule-strong)] animate-draw-rule stagger-2" />
      </div>

      {/* ---------- What it answers ---------- */}
      <section className="max-w-[1200px] mx-auto px-8 py-20 animate-fade-in stagger-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
          <div className="md:col-span-4">
            <div className="eyebrow mb-3">What it answers</div>
            <h2 className="font-display text-[28px] md:text-[32px] leading-tight tracking-tight">
              A fair fight between two strategies.
            </h2>
          </div>
          <div className="md:col-span-8">
            <p className="text-[16px] md:text-[17px] leading-[1.75] text-[var(--ink)] mb-5">
              Most rent-versus-buy comparisons stack the deck. They compare a mortgage payment
              to rent and declare the buyer the winner, while quietly ignoring stamp duty,
              maintenance, the mortgage rate after the fix, and what the renter could have done
              with the money they didn&apos;t spend.
            </p>
            <p className="text-[16px] md:text-[17px] leading-[1.75] text-[var(--ink)]">
              This calculator does the harder version. The renter invests the buyer&apos;s
              deposit plus the stamp duty the buyer had to pay, and each month they invest the
              difference between their rent and the buyer&apos;s full carrying cost. Both sides
              compound for the full mortgage term. The answer is whatever falls out.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-8">
        <div className="h-px bg-[var(--rule)]" />
      </div>

      {/* ---------- Three panels: what's in the model ---------- */}
      <section className="max-w-[1200px] mx-auto px-8 py-20">
        <div className="mb-12">
          <div className="eyebrow mb-3">What it models</div>
          <h2 className="font-display text-[28px] md:text-[32px] leading-tight tracking-tight max-w-2xl">
            The detail that usually gets skipped.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
          <Panel number="01" title="Proper UK stamp duty">
            Full band calculations for England, Scotland, Wales, and Northern Ireland.
            First-time buyer relief and the additional-home surcharge are handled automatically.
            If your situation is unusual, you can override the figure.
          </Panel>
          <Panel number="02" title="A full mortgage schedule">
            Your initial fix, then a re-fix at a rate you control for the remainder of the term.
            The payment changes when your fix ends, and the model tracks interest and capital
            separately for every month of the 25 years.
          </Panel>
          <Panel number="03" title="ISA and capital gains tax">
            The renter&apos;s portfolio fills the ISA allowance each year and moves £20,000 from
            the taxable account into the ISA annually. Gains remaining in the taxable account
            are taxed at exit. The numbers reflect what you&apos;d actually keep.
          </Panel>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-8">
        <div className="h-px bg-[var(--rule)]" />
      </div>

      {/* ---------- Intellectual honesty section ---------- */}
      <section className="max-w-[1200px] mx-auto px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
          <div className="md:col-span-4">
            <div className="eyebrow mb-3">What it doesn&apos;t</div>
            <h2 className="font-display text-[28px] md:text-[32px] leading-tight tracking-tight">
              Numbers are only part of it.
            </h2>
          </div>
          <div className="md:col-span-8">
            <p className="text-[16px] md:text-[17px] leading-[1.75] text-[var(--ink)] mb-5">
              There are good reasons to buy that don&apos;t show up on a spreadsheet. Security
              of tenure. The freedom to modify and extend. The ability to pass a home to your
              children. Not having a landlord sell the flat you&apos;ve lived in for six years.
              The calculator is silent on all of these.
            </p>
            <p className="text-[16px] md:text-[17px] leading-[1.75] text-[var(--ink)]">
              It also can&apos;t know whether you&apos;ll actually invest the monthly surplus
              with the discipline the model assumes. Forced saving through a mortgage often
              beats voluntary saving through a direct debit, because the first one has
              consequences if you stop. Take the answer as a financial floor to compare against,
              not a directive.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="max-w-[1200px] mx-auto px-8 py-24 border-t border-[var(--rule-strong)]">
        <div className="text-center">
          <h2 className="font-display text-[36px] md:text-[48px] leading-[1.1] tracking-tight mb-8 max-w-3xl mx-auto">
            Try it with your own numbers.
          </h2>
          <Link
            href="/calculator"
            className="inline-flex items-center gap-3 py-3 px-6 border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] text-[14px] hover:bg-[var(--ink-muted)] hover:border-[var(--ink-muted)] transition-colors"
          >
            Open the calculator
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-[var(--rule)]">
        <div className="max-w-[1200px] mx-auto px-8 py-8 flex items-baseline justify-between text-[12px] text-[var(--ink-subtle)]">
          <span>Rent vs Buy Calculator</span>
          <span>Not financial advice. For guidance, consult a qualified adviser.</span>
        </div>
      </footer>
    </main>
  );
}

function Panel({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-mono-num text-[12px] text-[var(--ink-subtle)] mb-3">{number}</div>
      <h3 className="font-display text-[20px] md:text-[22px] leading-tight tracking-tight mb-3">
        {title}
      </h3>
      <p className="text-[14px] leading-[1.75] text-[var(--ink-muted)]">{children}</p>
    </div>
  );
}
