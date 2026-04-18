import { describe, it, expect } from 'vitest';
import {
  calculateSDLT,
  calculateLBTT,
  calculateLTT,
  monthlyPayment,
  runModel,
  DEFAULT_ASSUMPTIONS,
  type UserInputs,
} from '../model';

describe('stamp duty', () => {
  it('calculates SDLT correctly on £1.15M main residence', () => {
    // 0% on first 125k = 0
    // 2% on 125k-250k = 2500
    // 5% on 250k-925k = 33750
    // 10% on 925k-1.15M = 22500
    // Total: 58750
    expect(calculateSDLT(1_150_000)).toBeCloseTo(58_750, 0);
  });

  it('applies FTB relief below £625k threshold', () => {
    // £500k FTB: 0% on first 425k, 5% on 425k-500k = 3750
    expect(calculateSDLT(500_000, { firstTimeBuyer: true })).toBeCloseTo(3_750, 0);
  });

  it('falls back to standard rates for FTB above £625k', () => {
    expect(calculateSDLT(700_000, { firstTimeBuyer: true })).toBe(calculateSDLT(700_000));
  });

  it('adds 5% surcharge for additional homes', () => {
    const main = calculateSDLT(500_000);
    const additional = calculateSDLT(500_000, { additionalHome: true });
    expect(additional - main).toBeCloseTo(500_000 * 0.05, 0);
  });

  it('calculates Scottish LBTT', () => {
    // £500k standard: 0% to 145k, 2% to 250k (2100), 5% to 325k (3750), 10% to 500k (17500) = 23350
    expect(calculateLBTT(500_000)).toBeCloseTo(23_350, 0);
  });

  it('calculates Welsh LTT', () => {
    // £500k: 0% to 225k, 6% to 400k (10500), 7.5% to 500k (7500) = 18000
    expect(calculateLTT(500_000)).toBeCloseTo(18_000, 0);
  });
});

describe('mortgage calculations', () => {
  it('calculates monthly payment correctly', () => {
    // £845,580 at 4.5% over 25 years should be ~£4,700
    const pmt = monthlyPayment(845_580, 0.045, 25);
    expect(pmt).toBeCloseTo(4_700, 0);
  });

  it('handles zero interest rate', () => {
    const pmt = monthlyPayment(120_000, 0, 10);
    expect(pmt).toBe(1_000); // 120k / 120 months
  });
});

describe('runModel', () => {
  const streathamInputs: UserInputs = {
    housePrice: 1_150_000,
    deposit: 304_420,
    termYears: 25,
    initialRate: 0.045,
    fixYears: 5,
    monthlyRent: 3_500,
  };

  it('produces sensible results for the Streatham Hill scenario', () => {
    const assumptions = {
      ...DEFAULT_ASSUMPTIONS,
      stampDuty: calculateSDLT(1_150_000),
      annualMaintenance: 2_000,
    };

    const result = runModel(streathamInputs, assumptions);

    // Mortgage should be fully paid
    expect(result.summary.mortgageBalanceEnd).toBeCloseTo(0, -2);

    // House should be worth ~£2.7M at 3.5% over 25 years
    expect(result.summary.houseValueEnd).toBeGreaterThan(2_600_000);
    expect(result.summary.houseValueEnd).toBeLessThan(2_800_000);

    // 25 years of yearly data
    expect(result.yearly).toHaveLength(25);

    // Each year should show valid numbers
    for (const y of result.yearly) {
      expect(y.mortgageBalance).toBeGreaterThanOrEqual(0);
      expect(y.houseValue).toBeGreaterThan(0);
      expect(y.rent).toBeGreaterThan(0);
      expect(Number.isFinite(y.renterPortfolio)).toBe(true);
    }
  });

  it('renter wins with low maintenance and reasonable returns', () => {
    const assumptions = {
      ...DEFAULT_ASSUMPTIONS,
      stampDuty: calculateSDLT(1_150_000),
      annualMaintenance: 2_000,
    };
    const result = runModel(streathamInputs, assumptions);
    expect(result.summary.winner).toBe('renter');
  });

  it('buyer wins when investment returns are very low', () => {
    const assumptions = {
      ...DEFAULT_ASSUMPTIONS,
      stampDuty: calculateSDLT(1_150_000),
      investmentReturn: 0.02, // very pessimistic
      houseGrowth: 0.04, // slightly above renter
    };
    const result = runModel(streathamInputs, assumptions);
    expect(result.summary.winner).toBe('buyer');
  });
});
