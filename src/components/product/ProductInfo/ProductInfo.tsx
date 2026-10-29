"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Heart, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { QuantitySelector } from "@/components/shared/QuantitySelector/QuantitySelector";
import { useCart } from "@/providers/CartProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatPrice } from "@/lib/utils/format-price";
import { Link, useRouter } from "@/i18n/routing";
import { PRODUCT_EXTRAS, unitPrice } from "@/lib/pricing";

export interface ProductVariantOption {
  id: string;
  name: string;
  sku: string;
  /** The variant's own price; null means it sells at the product price. */
  price: number | null;
  quantity: number;
  options: Record<string, string>;
}

// Clothing sizes in wearing order; anything unknown keeps its original position at the end.
const SIZE_ORDER = [
  "newborn", "0-3m", "3-6m", "6-12m", "12-18m", "18-24m", "2t", "3t", "4t", "5t",
  "2", "3", "4", "5", "6", "7", "8", "10", "12", "14", "16",
  "3xs", "2xs", "xxs", "xs", "s", "m", "l", "xl", "2xl", "xxl", "3xl", "xxxl", "4xl", "5xl", "6xl",
];

function sortValues(key: string, values: string[]): string[] {
  if (!/size/i.test(key)) return values;
  const rank = (v: string) => {
    const i = SIZE_ORDER.indexOf(v.trim().toLowerCase());
    return i === -1 ? SIZE_ORDER.length + values.indexOf(v) : i;
  };
  return [...values].sort((a, b) => rank(a) - rank(b));
}

interface ProductInfoProps {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  comparePrice?: number | null;
  quantity: number;
  shortDescription?: string | null;
  description?: string | null;
  brand?: string | null;
  condition: string;
  lowStockAlert: number;
  imageUrl?: string | null;
  ean?: string | null;
  reviewCount?: number;
  avgRating?: number;
  categoryPath?: { name: string; slug: string }[];
  variants?: ProductVariantOption[];
}

function Disclosure({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[color:var(--color-border)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-4 text-left text-[14px] font-medium"
      >
        {title}
        <ChevronDown size={16} strokeWidth={1.5} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="pb-5 text-[14px] leading-relaxed text-[color:var(--color-text-secondary)]">{children}</div>}
    </div>
  );
}

export function ProductInfo({
  id,
  name,
  slug,
  sku,
  price,
  comparePrice,
  quantity: stockQuantity,
  shortDescription,
  brand,
  condition,
  lowStockAlert,
  imageUrl,
  ean,
  reviewCount = 0,
  avgRating = 0,
  categoryPath = [],
  variants = [],
}: ProductInfoProps) {
  const t = useTranslations("product");
  const [qty, setQty] = useState(1);
  const [selectedExtra, setSelectedExtra] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [attempted, setAttempted] = useState(false);
  const { addItem } = useCart();
  const { currency, convert } = useCurrency();
  const router = useRouter();

  // Option groups (e.g. Color, Size) in a stable order: Color first, Size second, then the rest.
  const optionGroups = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const v of variants) {
      for (const [key, value] of Object.entries(v.options ?? {})) {
        if (!value) continue;
        const list = map.get(key) ?? [];
        if (!list.includes(value)) list.push(value);
        map.set(key, list);
      }
    }
    const weight = (k: string) => (/colou?r/i.test(k) ? 0 : /size/i.test(k) ? 1 : 2);
    return [...map.entries()]
      .sort(([a], [b]) => weight(a) - weight(b))
      .map(([key, values]) => ({ key, values: sortValues(key, values) }));
  }, [variants]);

  // Single-value groups need no decision — treat them as chosen.
  const effective = useMemo(() => {
    const out = { ...selected };
    for (const g of optionGroups) if (g.values.length === 1) out[g.key] = g.values[0];
    return out;
  }, [selected, optionGroups]);

  const missing = optionGroups.filter((g) => !effective[g.key]);
  const variant = missing.length
    ? undefined
    : variants.find((v) => optionGroups.every((g) => v.options?.[g.key] === effective[g.key]));

  // A value is available if some in-stock variant matches it plus every other current pick.
  const isAvailable = (key: string, value: string) =>
    variants.some(
      (v) =>
        v.options?.[key] === value &&
        v.quantity > 0 &&
        optionGroups.every((g) => g.key === key || !effective[g.key] || v.options?.[g.key] === effective[g.key]),
    );

  const availableQty = variant ? variant.quantity : stockQuantity;
  const outOfStock = variants.length ? (variant ? variant.quantity <= 0 : !variants.some((v) => v.quantity > 0)) : stockQuantity <= 0;
  const lowStock = !outOfStock && availableQty <= lowStockAlert;

  const extra = PRODUCT_EXTRAS[selectedExtra] ?? PRODUCT_EXTRAS[0];
  const variantPrices = variants.map((v) => v.price ?? price);
  const fromPrice = variantPrices.length ? Math.min(...variantPrices) : price;
  const hasPriceRange = variantPrices.some((p) => p !== fromPrice);
  // What one unit costs right now: the chosen variant (or the cheapest one) — the add-on is shown separately.
  const displayPrice = variant ? (variant.price ?? price) : fromPrice;
  const totalPrice = unitPrice({ productPrice: price, variantPrice: variant?.price, extraKey: extra.key });
  const cartName = extra.nameSuffix ? `${name} ${extra.nameSuffix}` : name;

  const add = (): boolean => {
    if (variants.length && !variant) {
      setAttempted(true);
      toast.error(`Please choose a ${missing[0]?.key.toLowerCase() ?? "option"}`);
      return false;
    }
    addItem({
      productId: id,
      name: cartName,
      slug,
      sku: variant?.sku ?? sku,
      price: totalPrice,
      quantity: qty,
      imageUrl: imageUrl || null,
      maxQuantity: availableQty,
      variantId: variant?.id,
      variantName: variant?.name,
      extraKey: extra.key === "none" ? undefined : extra.key,
    });
    return true;
  };

  const handleBuyNow = () => {
    if (add()) router.push("/checkout");
  };

  const handleWishlist = async () => {
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      });
      if (res.status === 401) {
        toast.error("Please sign in to save favourites");
        return;
      }
      const data = await res.json();
      toast.success(data.action === "added" ? t("addToWishlist") : t("removeFromWishlist"));
    } catch {
      toast.error("Please sign in to save favourites");
    }
  };

  const isOnSale = !variant && !!(comparePrice && comparePrice > price);
  const savingsPercent = isOnSale ? Math.round(((comparePrice! - price) / comparePrice!) * 100) : 0;
  const department = categoryPath[0];

  return (
    <div className="flex flex-col">
      {department && (
        <Link
          href={`/catalog/${categoryPath[categoryPath.length - 1].slug}`}
          className="text-[12px] uppercase tracking-[0.12em] text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-text)]"
        >
          {categoryPath.map((c) => c.name).join(" · ")}
        </Link>
      )}
      <h1 className="mt-3 break-words font-serif text-[34px] leading-[1.04] sm:text-[42px] [overflow-wrap:anywhere]">
        {name}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!variant && hasPriceRange && <span className="text-[15px] text-[color:var(--color-text-secondary)]">From</span>}
        <PriceDisplay price={displayPrice} comparePrice={variant ? null : comparePrice} size="lg" />
        {isOnSale && (
          <span className="bg-[color:var(--color-sale)] px-2 py-1 text-[11px] font-medium leading-none text-white">
            −{savingsPercent}%
          </span>
        )}
        {reviewCount > 0 && (
          <a href="#reviews" className="text-[13px] text-[color:var(--color-text-secondary)] hover:underline">
            <span className="text-[color:var(--color-sun-ink)]">{"★".repeat(Math.round(avgRating))}</span>
            {"☆".repeat(5 - Math.round(avgRating))} ({reviewCount})
          </a>
        )}
      </div>
      <p className="mt-1 text-[12px] text-[color:var(--color-text-tertiary)]">VAT included where applicable.</p>

      {shortDescription && (
        <p className="mt-6 text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">{shortDescription}</p>
      )}

      {/* Options */}
      {optionGroups.length > 0 && (
        <div className="mt-8 flex flex-col gap-6">
          {optionGroups.map((group) => {
            const isSize = /size/i.test(group.key);
            const value = effective[group.key];
            const showError = attempted && !value;
            return (
              <fieldset key={group.key}>
                <legend className="mb-3 flex w-full items-center justify-between text-[14px]">
                  <span>
                    <span className="font-medium">{group.key}</span>
                    {value && <span className="text-[color:var(--color-text-secondary)]">: {value}</span>}
                    {showError && <span className="ml-2 text-[color:var(--color-sale)]">Please choose one</span>}
                  </span>
                  {isSize && (
                    <Link href="/size-guide" className="hw-link text-[13px] text-[color:var(--color-text-secondary)]">
                      Size guide
                    </Link>
                  )}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {group.values.map((v) => {
                    const active = value === v;
                    const available = isAvailable(group.key, v);
                    return (
                      <button
                        key={v}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          setSelected((prev) => ({ ...prev, [group.key]: v }));
                          setQty(1);
                        }}
                        className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-[13px] transition-colors ${
                          isSize ? "min-w-[3.25rem]" : ""
                        } ${
                          active
                            ? "border-[color:var(--color-text)] bg-[color:var(--color-text)] text-[color:var(--color-bg)]"
                            : showError
                              ? "border-[color:var(--color-sale)]"
                              : "border-[color:var(--color-border-strong)] hover:border-[color:var(--color-text)]"
                        } ${available ? "" : "text-[color:var(--color-text-tertiary)] line-through decoration-1"}`}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>
      )}

      {/* Extras */}
      <div className="mt-8">
        <p className="mb-3 text-[14px] font-medium">{t("warranty")}</p>
        <div className="grid grid-cols-2 gap-2">
          {PRODUCT_EXTRAS.map((opt, idx) => (
            <button
              key={opt.key}
              type="button"
              aria-pressed={idx === selectedExtra}
              onClick={() => setSelectedExtra(idx)}
              className={`flex items-center justify-between gap-2 border px-3 py-2.5 text-left text-[13px] transition-colors ${
                idx === selectedExtra
                  ? "border-[color:var(--color-text)]"
                  : "border-[color:var(--color-border)] hover:border-[color:var(--color-border-strong)]"
              }`}
            >
              <span>{t(opt.labelKey)}</span>
              {opt.price > 0 && (
                <span className="shrink-0 text-[12px] tabular-nums text-[color:var(--color-text-secondary)]">
                  +{formatPrice(convert(opt.price), currency)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stock */}
      <p className="mt-6 inline-flex items-center gap-2 text-[13px]">
        <span
          aria-hidden
          className={`h-2 w-2 rounded-full ${
            outOfStock ? "bg-[color:var(--color-sale)]" : lowStock ? "bg-[color:var(--color-sun)]" : "bg-[color:var(--color-success)]"
          }`}
        />
        {outOfStock ? t("outOfStock") : lowStock ? t("onlyLeft", { count: availableQty }) : "In stock — made to order for you"}
      </p>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-3">
        <QuantitySelector quantity={qty} maxQuantity={Math.max(1, availableQty)} onChange={setQty} />
        <button
          type="button"
          onClick={() => add()}
          disabled={outOfStock}
          className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-[color:var(--color-primary)] px-6 text-[15px] font-medium text-[color:var(--color-primary-fg)] transition-colors hover:bg-[color:var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {outOfStock ? t("outOfStock") : "Add to bag"}
        </button>
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={t("addToWishlist")}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-border-strong)] transition-colors hover:border-[color:var(--color-text)]"
        >
          <Heart size={18} strokeWidth={1.5} />
        </button>
      </div>
      <button
        type="button"
        onClick={handleBuyNow}
        disabled={outOfStock}
        className="mt-3 inline-flex h-12 items-center justify-center rounded-full border border-[color:var(--color-text)] text-[15px] font-medium transition-colors hover:bg-[color:var(--color-text)] hover:text-[color:var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t("buyNow")}
      </button>

      {/* Details */}
      <div className="mt-10 border-t border-[color:var(--color-border)]">
        <Disclosure title="Delivery & returns" defaultOpen>
          <p>
            Free delivery on orders over £100. Each piece is made to order and dispatched from the UK —
            see our <Link href="/policies/shipping" className="hw-link text-[color:var(--color-text)]">delivery policy</Link> for times.
          </p>
          <p className="mt-2">
            Changed your mind? Return unworn items within 14 days.{" "}
            <Link href="/policies/returns" className="hw-link text-[color:var(--color-text)]">How returns work</Link>
          </p>
        </Disclosure>
        <Disclosure title="Product information">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5">
            {brand && (<><dt>{t("brand")}</dt><dd className="text-[color:var(--color-text)]">{brand}</dd></>)}
            <dt>{t("condition")}</dt>
            <dd className="text-[color:var(--color-text)]">{condition}</dd>
            <dt>{t("sku")}</dt>
            <dd className="break-all text-[color:var(--color-text)]">{variant?.sku ?? sku}</dd>
            {ean && (<><dt>{t("ean")}</dt><dd className="text-[color:var(--color-text)]">{ean}</dd></>)}
          </dl>
        </Disclosure>
        <Disclosure title="Secure payment">
          <p>Card payments are processed by a PCI DSS compliant provider. We never store your full card details.</p>
        </Disclosure>
      </div>
    </div>
  );
}
