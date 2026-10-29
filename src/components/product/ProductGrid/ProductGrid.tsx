"use client";

import { ProductCard, type CardProduct } from "@/components/product/ProductCard/ProductCard";

interface ProductGridProps {
  products: CardProduct[];
  /** Number of columns at the widest breakpoint. */
  columns?: 3 | 4;
}

export function ProductGrid({ products, columns = 3 }: ProductGridProps) {
  return (
    <div
      className={`grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:gap-y-14 ${
        columns === 4 ? "md:grid-cols-3 xl:grid-cols-4" : "md:grid-cols-3"
      }`}
    >
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} priority={i < 3} />
      ))}
    </div>
  );
}
