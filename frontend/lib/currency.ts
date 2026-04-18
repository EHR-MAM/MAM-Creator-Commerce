// lib/currency.ts — Sprint XXXIV
// Currency symbol map and price formatter for MAM multi-currency display.

export const CURRENCY_SYMBOL: Record<string, string> = {
  GHS: "GH₵",
  NGN: "₦",
  KES: "KSh",
  USD: "$",
  EUR: "€",
  GBP: "£",
  ZAR: "R",
  XOF: "CFA",
  EGP: "E£",
};

/**
 * Returns the symbol for a currency code, falling back to the code itself.
 * e.g. currencySymbol("GHS") → "GH₵"
 *      currencySymbol("GHS", true) → "GH₵ " (with trailing space for inline use)
 */
export function currencySymbol(code: string, trailingSpace = false): string {
  const sym = CURRENCY_SYMBOL[code] ?? code;
  return trailingSpace ? `${sym} ` : sym;
}

/**
 * Formats a number as a price string with currency symbol.
 * e.g. formatPrice(150, "GHS") → "GH₵ 150.00"
 *      formatPrice(150, "NGN") → "₦ 150.00"
 */
export function formatPrice(amount: number, code: string, decimals = 2): string {
  return `${currencySymbol(code)} ${amount.toFixed(decimals)}`;
}
