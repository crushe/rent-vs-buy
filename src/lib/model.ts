/**
 * Rent vs Buy finance model.
 *
 * Pure functions, no side effects. All monetary values in GBP.
 * All rates expressed as decimals (0.045 = 4.5%).
 */

export type Region = 'england' | 'scotland' | 'wales' | 'northern-ireland';

export interface UserInputs {
  /** Purchase price of the property in GBP */
  housePrice: number;
  /** Deposit amount in GBP */
  deposit: number;
  /** Mortgage term in years (typically 25 or 30) */
  termYears: number;
  /** Initial mortgage rate as decimal, e.g. 0.045 for 4.5% */
  initialRate: number;
  /** Length of the initial fix in years, e.g. 5 */
  fixYears: number;
  /** Monthly rent for an equivalent property in GBP */
  monthlyRent: number;
}

export interface Assumptions {
  /** Annual house price growth as decimal */
  houseGrowth: number;
  /** Annual investment return (S&P 500) as decimal */
  investmentReturn: number;
  /** Annual rent inflation as decimal */
  rentInflation: number;
  /** Mortgage rate assumed after initial fix ends, as decimal */
  postFixRate: number;
  /** Annual maintenance cost (flat GBP, grows with inflation) */
  annualMaintenance: number;
  /** Annual buildings insurance in GBP (grows with inflation) */
  annualInsurance: number;
  /** Annual contents insurance for the renter in GBP */
  renterInsurance: number;
  /** General price inflation as decimal */
  generalInflation: number;
  /** Effective CGT rate applied to investment gains outside ISA */
  effectiveCgtRate: number;
  /** Annual ISA allowance in GBP */
  isaAllowance: number;
  /** Stamp duty / equivalent in GBP (can be overridden) */
  stampDuty: number;
  /** Other upfront buyer costs (legal, survey) in GBP */
  upfrontFees: number;
  /** Estate agent % if buyer sells at end */
  sellingCostRate: number;
}

export interface YearResult {
  year: number;
  mortgagePayment: number;
  mortgageBalance: number;
  houseValue: number;
  buyerEquity: number;
  maintenance: number;
  insurance: number;
  rent: number;
  renterPortfolio: number;
  renterIsa: number;
  renterGia: number;
}

export interface ModelResult {
  /** Year-by-year trajectory */
  yearly: YearResult[];
  /** Final summary figures */
  summary: {
    housePrice: number;
    mortgagePrincipal: number;
    houseValueEnd: number;
    mortgageBalanceEnd: number;
    buyerEquityHeld: number;
    buyerEquitySold: number;
    renterNetWealth: number;
    renterIsaEnd: number;
    renterGiaEnd: number;
    renterCgtPaid: number;
    totalMortgagePaid: number;
    totalRentPaid: number;
    totalMaintenancePaid: number;
    difference: number;
    winner: 'buyer' | 'renter' | 'tied';
  };
}

// ---------- Stamp duty calculators ----------

/**
 * Calculate SDLT (England & Northern Ireland) for a standard purchase.
 * Rates correct as of 2026.
 */
export function calculateSDLT(
  price: number,
  opts: { firstTimeBuyer?: boolean; additionalHome?: boolean } = {}
): number {
  const { firstTimeBuyer = false, additionalHome = false } = opts;

  // First-time buyer relief: 0% up to £425k, 5% £425k-£625k, no relief above £625k
  if (firstTimeBuyer && price <= 625_000) {
    let duty = 0;
    if (price > 425_000) duty += (price - 425_000) * 0.05;
    return duty + (additionalHome ? price * 0.05 : 0);
  }

  // Standard bands (England & NI, 2026)
  const bands: Array<[number, number]> = [
    [125_000, 0.0],
    [125_000, 0.02], // £125k-£250k
    [675_000, 0.05], // £250k-£925k
    [575_000, 0.1], // £925k-£1.5M
    [Infinity, 0.12], // above £1.5M
  ];

  let remaining = price;
  let duty = 0;
  for (const [width, rate] of bands) {
    const amount = Math.min(remaining, width);
    duty += amount * rate;
    remaining -= amount;
    if (remaining <= 0) break;
  }

  // Additional home surcharge: 5% on full price (as of late 2024 onwards)
  if (additionalHome) duty += price * 0.05;

  return duty;
}

/**
 * Scotland LBTT. Bands as of 2026.
 */
export function calculateLBTT(
  price: number,
  opts: { firstTimeBuyer?: boolean; additionalHome?: boolean } = {}
): number {
  const { firstTimeBuyer = false, additionalHome = false } = opts;

  const ftbThreshold = firstTimeBuyer ? 175_000 : 145_000;

  const bands: Array<[number, number]> = [
    [ftbThreshold, 0.0],
    [250_000 - ftbThreshold, 0.02],
    [75_000, 0.05], // £250k-£325k
    [425_000, 0.1], // £325k-£750k
    [Infinity, 0.12], // above £750k
  ];

  let remaining = price;
  let duty = 0;
  for (const [width, rate] of bands) {
    const amount = Math.min(remaining, width);
    duty += amount * rate;
    remaining -= amount;
    if (remaining <= 0) break;
  }

  // Additional Dwelling Supplement (Scotland): 8% as of 2024
  if (additionalHome) duty += price * 0.08;

  return duty;
}

/**
 * Wales LTT. Bands as of 2026.
 */
export function calculateLTT(price: number, opts: { additionalHome?: boolean } = {}): number {
  const { additionalHome = false } = opts;

  const bands: Array<[number, number]> = [
    [225_000, 0.0],
    [175_000, 0.06], // £225k-£400k
    [350_000, 0.075], // £400k-£750k
    [750_000, 0.1], // £750k-£1.5M
    [Infinity, 0.12],
  ];

  let remaining = price;
  let duty = 0;
  for (const [width, rate] of bands) {
    const amount = Math.min(remaining, width);
    duty += amount * rate;
    remaining -= amount;
    if (remaining <= 0) break;
  }

  if (additionalHome) duty += price * 0.05;

  return duty;
}

export function calculateStampDuty(
  price: number,
  region: Region,
  opts: { firstTimeBuyer?: boolean; additionalHome?: boolean } = {}
): number {
  switch (region) {
    case 'scotland':
      return calculateLBTT(price, opts);
    case 'wales':
      return calculateLTT(price, opts);
    case 'england':
    case 'northern-ireland':
    default:
      return calculateSDLT(price, opts);
  }
}

// ---------- Mortgage calculations ----------

/**
 * Standard monthly mortgage payment formula.
 * M = P * r(1+r)^n / ((1+r)^n - 1)
 */
export function monthlyPayment(principal: number, annualRate: number, years: number): number {
  if (years <= 0) return 0;
  const r = annualRate / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  const factor = Math.pow(1 + r, n);
  return (principal * r * factor) / (factor - 1);
}

/**
 * Amortise one year of a mortgage. Returns the end-of-year balance.
 */
export function amortiseYear(
  startBalance: number,
  annualRate: number,
  monthlyPmt: number
): { endBalance: number; interestPaid: number; principalPaid: number } {
  const mr = annualRate / 12;
  let balance = startBalance;
  let interestPaid = 0;
  let principalPaid = 0;

  for (let m = 0; m < 12; m++) {
    const interest = balance * mr;
    const principal = Math.min(monthlyPmt - interest, balance);
    balance -= principal;
    interestPaid += interest;
    principalPaid += principal;
  }

  return { endBalance: balance, interestPaid, principalPaid };
}

// ---------- Core model ----------

/**
 * Default assumptions used when the user hasn't overridden them.
 * Conservative central estimates; user can adjust via sliders.
 */
export const DEFAULT_ASSUMPTIONS: Assumptions = {
  houseGrowth: 0.035,
  investmentReturn: 0.08,
  rentInflation: 0.035,
  postFixRate: 0.05,
  annualMaintenance: 2000,
  annualInsurance: 600,
  renterInsurance: 150,
  generalInflation: 0.025,
  effectiveCgtRate: 0.15,
  isaAllowance: 20_000,
  stampDuty: 0, // computed externally
  upfrontFees: 3200, // legal + survey
  sellingCostRate: 0.015,
};

/**
 * Run the full rent vs buy model.
 *
 * Logic:
 * 1. Amortise the mortgage year-by-year. Initial fix at user's rate, re-fixed at postFixRate for remainder.
 * 2. Track house value appreciation and buyer's carrying costs (maintenance, insurance).
 * 3. The renter invests:
 *    - Day one: the deposit equivalent PLUS the stamp duty + upfront fees the buyer had to pay
 *    - Each year: the difference between (buyer's total outgoings) and (renter's total outgoings)
 * 4. Investment portfolio splits between ISA (tax-free) and GIA (CGT on gains).
 *    Annual £20k bed-and-ISA transfer from GIA to ISA.
 * 5. Final CGT applied to remaining GIA gains.
 */
export function runModel(inputs: UserInputs, assumptions: Assumptions): ModelResult {
  const principal = inputs.housePrice - inputs.deposit;
  const depositEquivalent = inputs.deposit;
  const upfrontTotal = assumptions.stampDuty + assumptions.upfrontFees;

  // Initial monthly payment (on the user's initial rate for the full term)
  const initialMonthlyPmt = monthlyPayment(principal, inputs.initialRate, inputs.termYears);

  // Amortise the mortgage year-by-year
  let balance = principal;
  let postFixMonthlyPmt: number | null = null;
  const yearlyPayments: number[] = [];
  const yearlyBalances: number[] = [];

  for (let y = 1; y <= inputs.termYears; y++) {
    let rate: number;
    let pmt: number;

    if (y <= inputs.fixYears) {
      rate = inputs.initialRate;
      pmt = initialMonthlyPmt;
    } else {
      rate = assumptions.postFixRate;
      if (postFixMonthlyPmt === null) {
        // Re-amortise remaining balance over remaining term
        postFixMonthlyPmt = monthlyPayment(
          balance,
          assumptions.postFixRate,
          inputs.termYears - inputs.fixYears
        );
      }
      pmt = postFixMonthlyPmt;
    }

    const { endBalance } = amortiseYear(balance, rate, pmt);
    balance = endBalance;
    yearlyPayments.push(pmt);
    yearlyBalances.push(balance);
  }

  // Simulate renter portfolio
  const monthlyReturn = assumptions.investmentReturn / 12;
  const initialInvestment = depositEquivalent + upfrontTotal;

  let isaPot = Math.min(assumptions.isaAllowance, initialInvestment);
  let giaPot = initialInvestment - isaPot;
  let giaBasis = giaPot;

  let currentRent = inputs.monthlyRent;
  const yearly: YearResult[] = [];

  for (let y = 1; y <= inputs.termYears; y++) {
    const houseValue = inputs.housePrice * Math.pow(1 + assumptions.houseGrowth, y);
    const maintenance = assumptions.annualMaintenance * Math.pow(1 + assumptions.generalInflation, y - 1);
    const insurance = assumptions.annualInsurance * Math.pow(1 + assumptions.generalInflation, y - 1);
    const renterIns = assumptions.renterInsurance * Math.pow(1 + assumptions.generalInflation, y - 1);

    const buyerAnnualOut = yearlyPayments[y - 1] * 12 + maintenance + insurance;
    const renterAnnualOut = currentRent * 12 + renterIns;
    const annualSurplus = buyerAnnualOut - renterAnnualOut;
    const monthlySurplus = annualSurplus / 12;

    // Compound monthly with contributions
    for (let m = 0; m < 12; m++) {
      isaPot *= 1 + monthlyReturn;
      giaPot *= 1 + monthlyReturn;

      if (monthlySurplus >= 0) {
        giaPot += monthlySurplus;
        giaBasis += monthlySurplus;
      } else {
        // Negative surplus: withdraw from GIA first, reducing basis proportionally
        const withdrawal = -monthlySurplus;
        if (giaPot >= withdrawal) {
          const fraction = withdrawal / giaPot;
          giaBasis -= giaBasis * fraction;
          giaPot -= withdrawal;
        } else {
          // GIA depleted, fall through to ISA
          const remaining = withdrawal - giaPot;
          giaPot = 0;
          giaBasis = 0;
          isaPot = Math.max(0, isaPot - remaining);
        }
      }
    }

    // Annual bed-and-ISA: move up to £20k from GIA into ISA
    if (giaPot > 0) {
      const move = Math.min(assumptions.isaAllowance, giaPot);
      const fraction = move / giaPot;
      giaBasis -= giaBasis * fraction;
      giaPot -= move;
      isaPot += move;
    }

    yearly.push({
      year: y,
      mortgagePayment: yearlyPayments[y - 1],
      mortgageBalance: yearlyBalances[y - 1],
      houseValue,
      buyerEquity: houseValue - yearlyBalances[y - 1],
      maintenance,
      insurance,
      rent: currentRent,
      renterPortfolio: isaPot + giaPot,
      renterIsa: isaPot,
      renterGia: giaPot,
    });

    currentRent *= 1 + assumptions.rentInflation;
  }

  // Final calculations
  const finalYear = yearly[yearly.length - 1];
  const houseValueEnd = finalYear.houseValue;
  const mortgageBalanceEnd = finalYear.mortgageBalance;
  const buyerEquityHeld = houseValueEnd - mortgageBalanceEnd;
  const buyerEquitySold = buyerEquityHeld - houseValueEnd * assumptions.sellingCostRate - 2000;

  const giaGain = Math.max(0, giaPot - giaBasis);
  const cgtPaid = giaGain * assumptions.effectiveCgtRate;
  const renterNetWealth = isaPot + giaPot - cgtPaid;

  const totalMortgagePaid = yearly.reduce((acc, y) => acc + y.mortgagePayment * 12, 0);
  const totalRentPaid = yearly.reduce((acc, y) => acc + y.rent * 12, 0);
  const totalMaintenancePaid = yearly.reduce((acc, y) => acc + y.maintenance + y.insurance, 0);

  const difference = buyerEquityHeld - renterNetWealth;
  let winner: 'buyer' | 'renter' | 'tied' = 'tied';
  if (Math.abs(difference) < 10_000) winner = 'tied';
  else if (difference > 0) winner = 'buyer';
  else winner = 'renter';

  return {
    yearly,
    summary: {
      housePrice: inputs.housePrice,
      mortgagePrincipal: principal,
      houseValueEnd,
      mortgageBalanceEnd,
      buyerEquityHeld,
      buyerEquitySold,
      renterNetWealth,
      renterIsaEnd: isaPot,
      renterGiaEnd: giaPot,
      renterCgtPaid: cgtPaid,
      totalMortgagePaid,
      totalRentPaid,
      totalMaintenancePaid,
      difference,
      winner,
    },
  };
}
