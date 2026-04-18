import { describe, it, expect } from 'vitest';
import { encodeScenario, decodeScenario, DEFAULT_SCENARIO } from '../urlState';

describe('URL state encoding', () => {
  it('encodes nothing when state equals defaults', () => {
    expect(encodeScenario(DEFAULT_SCENARIO)).toBe('');
  });

  it('round-trips a non-default scenario', () => {
    const state = {
      ...DEFAULT_SCENARIO,
      housePrice: 1_150_000,
      deposit: 305_000,
      monthlyRent: 3_500,
      initialRate: 0.045,
      houseGrowth: 0.04,
      region: 'scotland' as const,
      firstTimeBuyer: true,
    };
    const encoded = encodeScenario(state);
    const decoded = decodeScenario(encoded);
    expect(decoded.housePrice).toBe(1_150_000);
    expect(decoded.deposit).toBe(305_000);
    expect(decoded.monthlyRent).toBe(3_500);
    expect(decoded.houseGrowth).toBeCloseTo(0.04, 4);
    expect(decoded.region).toBe('scotland');
    expect(decoded.firstTimeBuyer).toBe(true);
  });

  it('preserves floating-point rates accurately', () => {
    const state = {
      ...DEFAULT_SCENARIO,
      investmentReturn: 0.0825,
      initialRate: 0.0475,
    };
    const encoded = encodeScenario(state);
    const decoded = decodeScenario(encoded);
    expect(decoded.investmentReturn).toBeCloseTo(0.0825, 4);
    expect(decoded.initialRate).toBeCloseTo(0.0475, 4);
  });

  it('decodes with missing values using defaults', () => {
    const state = decodeScenario('p=1000000');
    expect(state.housePrice).toBe(1_000_000);
    expect(state.deposit).toBe(DEFAULT_SCENARIO.deposit);
    expect(state.termYears).toBe(DEFAULT_SCENARIO.termYears);
  });

  it('handles stamp duty override', () => {
    const state = { ...DEFAULT_SCENARIO, stampDutyOverride: 42_000 };
    const decoded = decodeScenario(encodeScenario(state));
    expect(decoded.stampDutyOverride).toBe(42_000);
  });

  it('produces short URLs for defaults with one change', () => {
    const state = { ...DEFAULT_SCENARIO, housePrice: 600_000 };
    const encoded = encodeScenario(state);
    expect(encoded.length).toBeLessThan(30);
  });
});
