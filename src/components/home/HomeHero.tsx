import { SafeImage } from "@/components/shared/SafeImage/SafeImage";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { brand } from "@/lib/brand";

interface HomeHeroProps {
  product?: {
    name: string;
    slug: string;
    images: { url: string; alt?: string | null }[];
  } | null;
}

/**
 * Split hero — serif headline and CTA on the left, one large product photo
 * on the right. Static on purpose: no carousel, nothing to wait for.
 */
export function HomeHero({ product }: HomeHeroProps) {
  const image = product?.images[0];

  return (
    <section className="hw-container grid gap-10 pb-16 pt-8 md:grid-cols-2 md:items-center md:gap-12 lg:pb-24 lg:pt-14">
      <div className="flex flex-col items-start">
        <span className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.12em] text-[color:var(--color-text-secondary)]">
          <span aria-hidden className="h-2 w-2 rounded-full bg-[color:var(--color-sun)]" />
          Everyday clothes for the whole family
        </span>
        <h1 className="mt-6 font-serif text-[52px] leading-[0.98] tracking-[-0.01em] sm:text-[68px] lg:text-[88px]">
          That summer feeling, <em className="italic">all year round.</em>
        </h1>
        <p className="mt-6 max-w-md text-[16px] leading-relaxed text-[color:var(--color-text-secondary)]">
          Soft tees, easy sweats and swim for women, men and kids — made to order by a small team in{" "}
          {brand.company.address.city}, Wales.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-6">
          <Link
            href="/catalog?sort=newest"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[color:var(--color-primary)] px-7 text-[15px] font-medium text-[color:var(--color-primary-fg)] transition-colors hover:bg-[color:var(--color-primary-hover)]"
          >
            Shop new in <ArrowRight size={16} />
          </Link>
          <Link href="/catalog/kids" className="hw-link text-[15px]">
            Shop kids
          </Link>
        </div>
      </div>

      <div>
        {image && product ? (
          <Link href={`/product/${product.slug}`} className="group block">
            <div className="relative aspect-[4/5] overflow-hidden bg-[color:var(--color-image-bg)]">
              <SafeImage
                src={image.url}
                alt={image.alt || product.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain p-[9%] mix-blend-multiply transition-transform duration-700 group-hover:scale-[1.02] dark:mix-blend-normal"
              />
            </div>
            <p className="mt-3 flex items-center justify-between text-[13px] text-[color:var(--color-text-secondary)]">
              <span className="line-clamp-1">{product.name}</span>
              <span className="shrink-0 pl-4 group-hover:underline group-hover:underline-offset-4">View</span>
            </p>
          </Link>
        ) : (
          <div className="aspect-[4/5] bg-[color:var(--color-image-bg)]" />
        )}
      </div>
    </section>
  );
}
