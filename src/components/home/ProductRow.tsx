import { Link } from "@/i18n/routing";
import { ProductCard, type CardProduct } from "@/components/product/ProductCard/ProductCard";

interface ProductRowProps {
  title: string;
  subtitle?: string;
  products: CardProduct[];
  viewAllHref: string;
  viewAllLabel?: string;
}

export function ProductRow({ title, subtitle, products, viewAllHref, viewAllLabel = "View all" }: ProductRowProps) {
  if (!products.length) return null;

  return (
    <section className="hw-container pb-20 lg:pb-28">
      <div className="mb-8 flex items-end justify-between gap-6 border-t border-[color:var(--color-border)] pt-6">
        <div>
          <h2 className="font-serif text-[36px] leading-none sm:text-[44px]">{title}</h2>
          {subtitle && <p className="mt-3 text-[15px] text-[color:var(--color-text-secondary)]">{subtitle}</p>}
        </div>
        <Link href={viewAllHref} className="hw-link shrink-0 text-[14px]">
          {viewAllLabel}
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
