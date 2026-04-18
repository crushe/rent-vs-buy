/**
 * URL state encoding.
 *
 * Encodes the full scenario state (inputs + assumptions) into a compact
 * query string so scenarios can be shared via link without a backend.
 *
 * Uses short keys to keep URLs under typical length limits, and only
 * serialises values that differ from defaults.
 */

import { DEFAULT_ASSUMPTIONS, type Region } from './model';

export interface ScenarioState {
  // Inputs
  housePrice: number;
  deposit: number;
  termYears: number;
  initialRate: number;
  fixYears: number;
  monthlyRent: number;

  // Stamp duty circumstances
  region: Region;
  firstTimeBuyer: boolean;
  additionalHome: boolean;
  stampDutyOverride: number | null;

  // Assumptions
  houseGrowth: number;
  investmentReturn: number;
  rentInflation: number;
  postFixRate: number;
  annualMaintenance: number;
}

export const DEFAULT_SCENARIO: ScenarioState = {
  housePrice: 500_000,
  deposit: 100_000,
  termYears: 25,
  initialRate: 0.045,
  fixYears: 5,
  monthlyRent: 1_800,
  region: 'england',
  firstTimeBuyer: false,
  additionalHome: false,
  stampDutyOverride: null,
  houseGrowth: DEFAULT_ASSUMPTIONS.houseGrowth,
  investmentReturn: DEFAULT_ASSUMPTIONS.investmentReturn,
  rentInflation: DEFAULT_ASSUMPTIONS.rentInflation,
  postFixRate: DEFAULT_ASSUMPTIONS.postFixRate,
  annualMaintenance: DEFAULT_ASSUMPTIONS.annualMaintenance,
};

// Short keys for URL compactness
const KEYS: Record<keyof ScenarioState, string> = {
  housePrice: 'p',
  deposit: 'd',
  termYears: 't',
  initialRate: 'r',
  fixYears: 'f',
  monthlyRent: 'n',
  region: 'g',
  firstTimeBuyer: 'b',
  additionalHome: 'a',
  stampDutyOverride: 's',
  houseGrowth: 'h',
  investmentReturn: 'i',
  rentInflation: 'l',
  postFixRate: 'o',
  annualMaintenance: 'm',
};

const REGION_CODES: Record<Region, string> = {
  england: 'e',
  scotland: 's',
  wales: 'w',
  'northern-ireland': 'n',
};
const REGION_DECODE: Record<string, Region> = {
  e: 'england',
  s: 'scotland',
  w: 'wales',
  n: 'northern-ireland',
};

/**
 * Encode a scenario to a query string. Only includes values that differ from
 * the default, to keep URLs short.
 */
export function encodeScenario(state: ScenarioState): string {
  const params = new URLSearchParams();

  const add = (key: keyof ScenarioState, value: string | number | boolean | null) => {
    if (value === null || value === undefined) return;
    params.set(KEYS[key], String(value));
  };

  if (state.housePrice !== DEFAULT_SCENARIO.housePrice) add('housePrice', state.housePrice);
  if (state.deposit !== DEFAULT_SCENARIO.deposit) add('deposit', state.deposit);
  if (state.termYears !== DEFAULT_SCENARIO.termYears) add('termYears', state.termYears);
  if (state.initialRate !== DEFAULT_SCENARIO.initialRate)
    add('initialRate', +(state.initialRate * 10000).toFixed(0)); // basis points × 10
  if (state.fixYears !== DEFAULT_SCENARIO.fixYears) add('fixYears', state.fixYears);
  if (state.monthlyRent !== DEFAULT_SCENARIO.monthlyRent) add('monthlyRent', state.monthlyRent);

  if (state.region !== DEFAULT_SCENARIO.region)
    params.set(KEYS.region, REGION_CODES[state.region]);
  if (state.firstTimeBuyer) params.set(KEYS.firstTimeBuyer, '1');
  if (state.additionalHome) params.set(KEYS.additionalHome, '1');
  if (state.stampDutyOverride !== null) add('stampDutyOverride', state.stampDutyOverride);

  if (state.houseGrowth !== DEFAULT_SCENARIO.houseGrowth)
    add('houseGrowth', +(state.houseGrowth * 10000).toFixed(0));
  if (state.investmentReturn !== DEFAULT_SCENARIO.investmentReturn)
    add('investmentReturn', +(state.investmentReturn * 10000).toFixed(0));
  if (state.rentInflation !== DEFAULT_SCENARIO.rentInflation)
    add('rentInflation', +(state.rentInflation * 10000).toFixed(0));
  if (state.postFixRate !== DEFAULT_SCENARIO.postFixRate)
    add('postFixRate', +(state.postFixRate * 10000).toFixed(0));
  if (state.annualMaintenance !== DEFAULT_SCENARIO.annualMaintenance)
    add('annualMaintenance', state.annualMaintenance);

  return params.toString();
}

/**
 * Decode a query string back into a scenario. Missing values use defaults.
 */
export function decodeScenario(search: string): ScenarioState {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const state: ScenarioState = { ...DEFAULT_SCENARIO };

  const num = (key: string): number | undefined => {
    const v = params.get(key);
    return v === null ? undefined : parseFloat(v);
  };

  const rate = (key: string): number | undefined => {
    const v = num(key);
    return v === undefined ? undefined : v / 10000;
  };

  if (num(KEYS.housePrice) !== undefined) state.housePrice = num(KEYS.housePrice)!;
  if (num(KEYS.deposit) !== undefined) state.deposit = num(KEYS.deposit)!;
  if (num(KEYS.termYears) !== undefined) state.termYears = num(KEYS.termYears)!;
  if (rate(KEYS.initialRate) !== undefined) state.initialRate = rate(KEYS.initialRate)!;
  if (num(KEYS.fixYears) !== undefined) state.fixYears = num(KEYS.fixYears)!;
  if (num(KEYS.monthlyRent) !== undefined) state.monthlyRent = num(KEYS.monthlyRent)!;

  const regionCode = params.get(KEYS.region);
  if (regionCode && REGION_DECODE[regionCode]) state.region = REGION_DECODE[regionCode];
  state.firstTimeBuyer = params.get(KEYS.firstTimeBuyer) === '1';
  state.additionalHome = params.get(KEYS.additionalHome) === '1';
  if (num(KEYS.stampDutyOverride) !== undefined)
    state.stampDutyOverride = num(KEYS.stampDutyOverride)!;

  if (rate(KEYS.houseGrowth) !== undefined) state.houseGrowth = rate(KEYS.houseGrowth)!;
  if (rate(KEYS.investmentReturn) !== undefined)
    state.investmentReturn = rate(KEYS.investmentReturn)!;
  if (rate(KEYS.rentInflation) !== undefined) state.rentInflation = rate(KEYS.rentInflation)!;
  if (rate(KEYS.postFixRate) !== undefined) state.postFixRate = rate(KEYS.postFixRate)!;
  if (num(KEYS.annualMaintenance) !== undefined)
    state.annualMaintenance = num(KEYS.annualMaintenance)!;

  return state;
}

/**
 * Build a shareable URL for the current scenario.
 */
export function buildShareUrl(state: ScenarioState, baseUrl?: string): string {
  const base =
    baseUrl ??
    (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '');
  const qs = encodeScenario(state);
  return qs ? `${base}?${qs}` : base;
}
