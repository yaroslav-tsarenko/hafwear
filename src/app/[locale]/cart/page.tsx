"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { SafeImage } from "@/components/shared/SafeImage/SafeImage";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Lock, ImageOff } from "lucide-react";
import { useCart } from "@/providers/CartProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { QuantitySelector } from "@/components/shared/QuantitySelector/QuantitySelector";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { formatPrice } from "@/lib/utils/format-price";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";

export default function CartPage() {
  const t = useTranslations("cart");
  const nav = useTranslations("nav");
  const { cart, updateQuantity, removeItem } = useCart();
  const { currency, convert } = useCurrency();

  const freeShippingThreshold = convert(FREE_SHIPPING_THRESHOLD);
  const subtotalConverted = convert(cart.subtotal);
  const remaining = Math.max(0, freeShippingThreshold - subtotalConverted);
  const progress = Math.min(100, (subtotalConverted / freeShippingThreshold) * 100);

  return (
    <div className="hw-container pb-24">
      <Breadcrumbs items={[{ label: nav("home"), href: "/" }, { label: "Bag" }]} />

      <h1 className="pb-10 pt-4 font-serif text-[48px] leading-none sm:text-[64px]">
        Your bag
        {cart.items.length > 0 && (
          <span className="ml-3 align-middle font-sans text-[15px] text-[color:var(--color-text-tertiary)]">
            {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}
          </span>
        )}
      </h1>

      {cart.items.length === 0 ? (
        <EmptyState
          title={t("empty")}
          subtitle={t("emptySubtitle")}
          actionLabel={t("continueShopping")}
          actionHref="/catalog"
        />
      ) : (
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_400px] lg:gap-16">
          <ul className="border-t border-[color:var(--color-border)]">
            <AnimatePresence initial={false}>
              {cart.items.map((item) => (
                <motion.li
                  key={item.id}
                  layout
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-5 overflow-hidden border-b border-[color:var(--color-border)] py-6"
                >
                  <Link
                    href={`/product/${item.slug}`}
                    className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden bg-[color:var(--color-image-bg)] sm:w-32"
                  >
                    {item.imageUrl ? (
                      <SafeImage
                        compactFallback
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="128px"
                        className="object-contain p-2 mix-blend-multiply dark:mix-blend-normal"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[color:var(--color-text-tertiary)]">
                        <ImageOff size={20} strokeWidth={1.25} />
                      </span>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Link
                          href={`/product/${item.slug}`}
                          className="line-clamp-2 break-words text-[15px] hover:underline hover:underline-offset-4 [overflow-wrap:anywhere]"
                        >
                          {item.name}
                        </Link>
                        {item.variantName && (
                          <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]">{item.variantName}</p>
                        )}
                        <p className="mt-1 text-[12px] text-[color:var(--color-text-tertiary)]">
                          {formatPrice(convert(item.price), currency)} each
                        </p>
                      </div>
                      <span className="shrink-0 text-[15px] tabular-nums">
                        {formatPrice(convert(item.price * item.quantity), currency)}
                      </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                      <QuantitySelector
                        size="sm"
                        quantity={item.quantity}
                        maxQuantity={item.maxQuantity}
                        onChange={(qty) => updateQuantity(item.id, qty)}
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-[13px] text-[color:var(--color-text-secondary)] underline underline-offset-4 hover:text-[color:var(--color-text)]"
                      >
                        {t("remove")}
                      </button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <aside className="bg-[color:var(--color-bg-secondary)] p-6 sm:p-8 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
            <h2 className="font-serif text-[30px] leading-none">Summary</h2>

            <div className="mt-6">
              {remaining > 0 ? (
                <p className="text-[13px] text-[color:var(--color-text-secondary)]">
                  You&apos;re {formatPrice(remaining, currency)} away from free delivery.
                </p>
              ) : (
                <p className="text-[13px]">You&apos;ve unlocked free delivery.</p>
              )}
              <div className="mt-2 h-[3px] w-full bg-[color:var(--color-border)]" aria-hidden>
                <div className="h-full bg-[color:var(--color-sun)] transition-[width]" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <dl className="mt-6 flex flex-col gap-3 text-[14px]">
              <div className="flex justify-between">
                <dt className="text-[color:var(--color-text-secondary)]">{t("subtotal")}</dt>
                <dd className="tabular-nums">{formatPrice(convert(cart.subtotal), currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[color:var(--color-text-secondary)]">{t("shipping")}</dt>
                <dd className="tabular-nums">
                  {cart.shippingCost > 0 ? formatPrice(convert(cart.shippingCost), currency) : "Free"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[color:var(--color-text-secondary)]">VAT</dt>
                <dd className="text-[color:var(--color-text-secondary)]">Included</dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-[color:var(--color-border-strong)] pt-4 text-[17px]">
                <dt>{t("total")}</dt>
                <dd className="tabular-nums">{formatPrice(convert(cart.total), currency)}</dd>
              </div>
            </dl>

            <Link
              href="/checkout"
              className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[color:var(--color-primary)] text-[15px] font-medium text-[color:var(--color-primary-fg)] transition-colors hover:bg-[color:var(--color-primary-hover)]"
            >
              {t("checkout")} <ArrowRight size={16} />
            </Link>
            <Link href="/catalog" className="hw-link mt-4 block text-center text-[14px]">
              {t("continueShopping")}
            </Link>

            <p className="mt-6 flex items-center justify-center gap-1.5 border-t border-[color:var(--color-border)] pt-5 text-[12px] text-[color:var(--color-text-tertiary)]">
              <Lock size={12} /> Secure checkout · 14-day returns
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
