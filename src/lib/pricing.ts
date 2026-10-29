/**
 * Single source of truth for everything that changes what a customer pays.
 * Imported by the product page, the cart and the checkout API so the price
 * shown in the browser is the price charged on the server.
 * All amounts are in the store's base currency (GBP) and VAT-inclusive.
 */

/** UK standard VAT rate, percent. Prices already include it. */
export const VAT_RATE = 20;

/** Free delivery applies when the subtotal after discounts reaches this amount. */
export const FREE_SHIPPING_THRESHOLD = 100;

/**
 * Optional flat-priced add-ons offered on the product page. The label keys
 * stay aligned with the legacy "warrantyOption{n}year" translations so the
 * message files don't need to change.
 */
export const PRODUCT_EXTRAS = [
  { key: "none", labelKey: "noWarranty", nameSuffix: "", price: 0 },
  { key: "gift", labelKey: "warrantyOption1year", nameSuffix: "+ gift wrap", price: 3.99 },
  { key: "care", labelKey: "warrantyOption2year", nameSuffix: "+ care kit", price: 6.99 },
  { key: "prio", labelKey: "warrantyOption3year", nameSuffix: "+ priority dispatch", price: 4.99 },
] as const;

export type ProductExtra = (typeof PRODUCT_EXTRAS)[number];
export type ProductExtraKey = ProductExtra["key"];

export const PRODUCT_EXTRA_KEYS = PRODUCT_EXTRAS.map((e) => e.key) as [ProductExtraKey, ...ProductExtraKey[]];

export function getExtra(key: string | null | undefined): ProductExtra {
  return PRODUCT_EXTRAS.find((e) => e.key === key) ?? PRODUCT_EXTRAS[0];
}

export const SHIPPING_RATES = {
  standard: 5.99,
  express: 12.99,
  free: 0,
} as const;

export type ShippingMethodKey = keyof typeof SHIPPING_RATES;

/** Rounds to pennies, avoiding binary float drift (0.1 + 0.2). */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/** Whether the free (economy) method can be chosen for this subtotal. */
export function isFreeShippingEligible(discountedSubtotal: number): boolean {
  return discountedSubtotal >= FREE_SHIPPING_THRESHOLD;
}

/**
 * Delivery cost for the chosen method. An unknown method, or "free" below the
 * threshold, falls back to standard delivery.
 */
export function shippingCostFor(method: string | null | undefined, discountedSubtotal: number): number {
  if (discountedSubtotal <= 0) return 0;
  if (method === "free") {
    return isFreeShippingEligible(discountedSubtotal) ? SHIPPING_RATES.free : SHIPPING_RATES.standard;
  }
  if (method === "express") return SHIPPING_RATES.express;
  return SHIPPING_RATES.standard;
}

/** Cheapest delivery available — what the cart shows before a method is picked. */
export function estimatedShipping(discountedSubtotal: number): number {
  if (discountedSubtotal <= 0) return 0;
  return isFreeShippingEligible(discountedSubtotal) ? SHIPPING_RATES.free : SHIPPING_RATES.standard;
}

/** The VAT portion already contained in a VAT-inclusive amount. */
export function vatIncluded(amount: number): number {
  // gross × rate / (100 + rate) — e.g. 1/6 of the price at 20%. Subtracting
  // amount / 1.2 instead drifts below half-pennies and rounds the wrong way.
  return roundMoney((amount * VAT_RATE) / (100 + VAT_RATE));
}

/** Price of one unit: the variant's own price when it has one, plus the chosen add-on. */
export function unitPrice(args: {
  productPrice: number;
  variantPrice?: number | null;
  extraKey?: string | null;
}): number {
  const base = args.variantPrice ?? args.productPrice;
  return roundMoney(base + getExtra(args.extraKey).price);
}
