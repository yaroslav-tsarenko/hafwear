"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { ImageOff } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatPrice } from "@/lib/utils/format-price";

export interface CardProduct {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  comparePrice?: number | string | null;
  quantity?: number;
  images: { url: string; alt?: string | null }[];
  categories?: { category: { name: string } }[];
}

interface ProductCardProps {
  product: CardProduct;
  /** Eager-load the first row of a grid. */
  priority?: boolean;
  sizes?: string;
}

/**
 * Soft Minimal product tile — photo first, name and price underneath.
 * No quick-add: most products need a size picked on the product page.
 * The second photo (usually the back) fades in on hover.
 */
export function ProductCard({
  product,
  priority = false,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
}: ProductCardProps) {
  const { currency, convert } = useCurrency();
  const price = Number(product.price);
  const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;
  const isOnSale = !!(comparePrice && comparePrice > price);
  const discountPct = isOnSale ? Math.round(((comparePrice! - price) / comparePrice!) * 100) : 0;
  const outOfStock = product.quantity !== undefined && product.quantity <= 0;
  const [primary, secondary] = product.images;
  const category = product.categories?.[0]?.category?.name;

  return (
    <Link href={`/product/${product.slug}`} className="group flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-[color:var(--color-image-bg)]">
        {primary ? (
          <>
            <Image
              src={primary.url}
              alt={primary.alt || product.name}
              fill
              sizes={sizes}
              priority={priority}
              className={`object-contain p-[8%] mix-blend-multiply transition-opacity duration-500 dark:mix-blend-normal ${
                secondary ? "group-hover:opacity-0" : ""
              }`}
            />
            {secondary && (
              <Image
                src={secondary.url}
                alt=""
                aria-hidden
                fill
                sizes={sizes}
                className="object-contain p-[8%] opacity-0 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-100 dark:mix-blend-normal"
              />
            )}
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[color:var(--color-text-tertiary)]">
            <ImageOff size={24} strokeWidth={1.25} />
            <span className="text-[12px]">No image</span>
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {isOnSale && (
            <span className="bg-[color:var(--color-sale)] px-2 py-1 text-[11px] font-medium leading-none text-white">
              −{discountPct}%
            </span>
          )}
          {outOfStock && (
            <span className="bg-[color:var(--color-bg-elevated)] px-2 py-1 text-[11px] font-medium leading-none text-[color:var(--color-text-secondary)]">
              Sold out
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 pt-3">
        {category && (
          <span className="text-[12px] text-[color:var(--color-text-tertiary)]">{category}</span>
        )}
        <h3 className="line-clamp-2 text-[14px] leading-snug text-[color:var(--color-text)] group-hover:underline group-hover:underline-offset-4">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2 text-[14px] tabular-nums">
          <span className={isOnSale ? "text-[color:var(--color-sale)]" : "text-[color:var(--color-text)]"}>
            {formatPrice(convert(price), currency)}
          </span>
          {isOnSale && (
            <span className="text-[13px] text-[color:var(--color-text-tertiary)] line-through">
              {formatPrice(convert(comparePrice!), currency)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
