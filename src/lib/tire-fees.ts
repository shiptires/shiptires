/**
 * State-level tire disposal fees, sales tax rates, and order handling fee.
 *
 * Tax rates are state-level only (no county/city) — an approximation.
 * Review periodically as rates change.
 */

// Per-tire disposal/recycling fee (USD)
const STATE_TIRE_FEES: Record<string, number> = {
  CA: 1.75,
  NY: 2.5,
  IL: 2.5,
  TX: 2.0,
  NC: 2.0,
  SC: 2.0,
  WI: 2.0,
  LA: 2.0,
  CO: 1.5,
  TN: 1.5,
  AL: 1.0,
  FL: 1.0,
  GA: 1.0,
  ID: 1.0,
  ME: 1.0,
  MD: 1.0,
  MS: 1.0,
  NE: 1.0,
  NV: 1.0,
  OH: 1.0,
  OK: 1.0,
  OR: 1.0,
  UT: 1.0,
  VT: 1.0,
  WA: 1.0,
  CT: 0.5,
  KS: 0.5,
  MN: 0.5,
  MO: 0.5,
  RI: 0.5,
  VA: 0.5,
  IN: 0.25,
};

// State sales tax rates (percentage, state-level only)
const STATE_TAX_RATES: Record<string, number> = {
  AK: 0,
  DE: 0,
  MT: 0,
  NH: 0,
  OR: 0,
  AL: 4.0,
  AZ: 5.6,
  AR: 6.5,
  CA: 7.25,
  CO: 2.9,
  CT: 6.35,
  DC: 6.0,
  FL: 6.0,
  GA: 4.0,
  HI: 4.0,
  ID: 6.0,
  IL: 6.25,
  IN: 7.0,
  IA: 6.0,
  KS: 6.5,
  KY: 6.0,
  LA: 4.45,
  ME: 5.5,
  MD: 6.0,
  MA: 6.25,
  MI: 6.0,
  MN: 6.875,
  MS: 7.0,
  MO: 4.225,
  NE: 5.5,
  NV: 6.85,
  NJ: 6.625,
  NM: 5.0,
  NY: 4.0,
  NC: 4.75,
  ND: 5.0,
  OH: 5.75,
  OK: 4.5,
  PA: 6.0,
  RI: 7.0,
  SC: 6.0,
  SD: 4.2,
  TN: 7.0,
  TX: 6.25,
  UT: 6.1,
  VT: 6.0,
  VA: 5.3,
  WA: 6.5,
  WV: 6.0,
  WI: 5.0,
  WY: 4.0,
};

/** Flat handling fee per order (USD). */
export const HANDLING_FEE = 5.0;

/** Per-tire disposal fee for the given state, or 0 if none. */
export function getTireFee(state: string): number {
  return STATE_TIRE_FEES[state.toUpperCase()] ?? 0;
}

/** State sales tax as a decimal (e.g. 0.0725 for CA). Returns 0 for unknown states. */
export function getSalesTaxRate(state: string): number {
  const pct = STATE_TAX_RATES[state.toUpperCase()];
  if (pct === undefined) return 0;
  return pct / 100;
}

export interface OrderFees {
  tireFeePerTire: number;
  tireFeeTotal: number;
  handlingFee: number;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

/**
 * Calculate all fees and tax for an order.
 * Tax applies to: tire subtotal + tire disposal fee + handling fee.
 */
export function calculateOrderFees(
  state: string,
  tireCount: number,
  subtotal: number
): OrderFees {
  const tireFeePerTire = getTireFee(state);
  const tireFeeTotal = tireFeePerTire * tireCount;
  const handlingFee = HANDLING_FEE;
  const taxableAmount = subtotal + tireFeeTotal + handlingFee;
  const taxRate = getSalesTaxRate(state);
  const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;
  const total = subtotal + tireFeeTotal + handlingFee + taxAmount;

  return {
    tireFeePerTire,
    tireFeeTotal,
    handlingFee,
    taxableAmount,
    taxRate,
    taxAmount,
    total,
  };
}
