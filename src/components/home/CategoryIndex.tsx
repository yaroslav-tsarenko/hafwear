import Image from "next/image";
import { Link } from "@/i18n/routing";

export interface CategoryIndexItem {
  id: string;
  label: string;
  slug: string;
  imageUrl: string | null;
  count: number;
}

/**
 * A quiet index of categories — a list of names with a small thumbnail,
 * closer to a magazine contents page than a grid of banners.
 */
export function CategoryIndex({ items }: { items: CategoryIndexItem[] }) {
  if (!items.length) return null;

  return (
    <section className="hw-container py-20 lg:py-28">
      <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
        <div>
          <h2 className="font-serif text-[36px] leading-none sm:text-[44px]">Shop by category</h2>
          <p className="mt-4 max-w-xs text-[15px] text-[color:var(--color-text-secondary)]">
            From first tees to swim — everything we make, in one place.
          </p>
          <Link href="/catalog" className="hw-link mt-6 inline-block text-[14px]">
            View all products
          </Link>
        </div>
        <ul className="grid border-t border-[color:var(--color-border)] sm:grid-cols-2 sm:gap-x-10">
          {items.map((item) => (
            <li key={item.id} className="border-b border-[color:var(--color-border)]">
              <Link href={`/catalog/${item.slug}`} className="group flex items-center gap-4 py-4">
                <span className="relative h-14 w-12 shrink-0 overflow-hidden bg-[color:var(--color-image-bg)]">
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-contain p-1 mix-blend-multiply dark:mix-blend-normal"
                    />
                  )}
                </span>
                <span className="flex-1 text-[16px] group-hover:underline group-hover:underline-offset-4">{item.label}</span>
                <span className="text-[13px] tabular-nums text-[color:var(--color-text-tertiary)]">{item.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
