"use client";

import { formatPrice } from "@/lib/utils/format-price";
import { useCurrency } from "@/providers/CurrencyProvider";

interface PriceDisplayProps {
  price: number;
  comparePrice?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClass: Record<NonNullable<PriceDisplayProps["size"]>, { current: string; compare: string }> = {
  sm: { current: "text-[14px]", compare: "text-[13px]" },
  md: { current: "text-[18px]", compare: "text-[14px]" },
  lg: { current: "text-[22px]", compare: "text-[16px]" },
};

export function PriceDisplay({ price, comparePrice, size = "md", className }: PriceDisplayProps) {
  const { currency, convert } = useCurrency();
  const isOnSale = !!(comparePrice && comparePrice > price);

  return (
    <div className={`flex items-baseline gap-2 tabular-nums ${className ?? ""}`}>
      <span
        className={`${sizeClass[size].current} ${
          isOnSale ? "text-[color:var(--color-sale)]" : "text-[color:var(--color-text)]"
        }`}
      >
        {formatPrice(convert(price), currency)}
      </span>
      {isOnSale && (
        <span className={`${sizeClass[size].compare} text-[color:var(--color-text-tertiary)] line-through`}>
          {formatPrice(convert(comparePrice!), currency)}
        </span>
      )}
    </div>
  );
}
