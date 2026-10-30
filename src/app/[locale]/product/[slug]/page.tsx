import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductGallery } from "@/components/product/ProductGallery/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo/ProductInfo";
import { ProductTabs } from "@/components/product/ProductTabs/ProductTabs";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { JsonLd } from "@/components/shared/SEO/JsonLd";
import { absoluteImageUrl } from "@/lib/media";

export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

type CategoryRow = { id: string; name: string; slug: string; parentId: string | null };

const getCategoryLookup = unstable_cache(
  async (): Promise<CategoryRow[]> => {
    return prisma.category.findMany({
      select: { id: true, name: true, slug: true, parentId: true },
    });
  },
  ["product-page-category-lookup-v2"],
  { revalidate: 300, tags: ["categories"] },
);

async function getCategoryChain(categoryId: string): Promise<{ name: string; slug: string }[]> {
  const rows = await getCategoryLookup();
  const map = new Map<string, CategoryRow>();
  for (const r of rows) map.set(r.id, r);

  const chain: { name: string; slug: string }[] = [];
  let currentId: string | null = categoryId;
  const guard = new Set<string>();

  while (currentId && !guard.has(currentId)) {
    guard.add(currentId);
    const cat = map.get(currentId);
    if (!cat) break;
    chain.unshift({ name: cat.name, slug: cat.slug });
    currentId = cat.parentId;
  }

  return chain;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, metaTitle: true, metaDescription: true, shortDescription: true },
  });

  if (!product) return {};

  return {
    title: product.metaTitle || product.name,
    description: product.metaDescription || product.shortDescription || product.name,
    alternates: { canonical: `/${locale}/product/${slug}` },
    openGraph: {
      title: product.metaTitle || product.name,
      description: product.metaDescription || product.shortDescription || undefined,
      url: `/${locale}/product/${slug}`,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      description: true,
      shortDescription: true,
      price: true,
      comparePrice: true,
      quantity: true,
      lowStockAlert: true,
      status: true,
      brand: true,
      condition: true,
      ean: true,
      gtin: true,
      characteristics: true,
      images: { select: { id: true, url: true, alt: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
      categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
      variants: true,
      reviews: {
        where: { isApproved: true },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!product || product.status === "ARCHIVED") notFound();

  const primaryCategory = product.categories[0]?.category;
  const categoryChain = primaryCategory
    ? await getCategoryChain(primaryCategory.id)
    : [];

  const reviewCount = product.reviews.length;
  const avgRating = reviewCount > 0
    ? product.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviewCount
    : 0;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hafwear.com";

  const characteristics = product.characteristics as Record<string, Record<string, string>> | null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.shortDescription || product.name,
    sku: product.sku,
    gtin13: product.ean || product.gtin || undefined,
    image: absoluteImageUrl(product.images[0]?.url, siteUrl) || undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      price: Number(product.price),
      priceCurrency: "GBP",
      availability: product.quantity > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${siteUrl}/en/product/${product.slug}`,
    },
    ...(reviewCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating.toFixed(1),
        reviewCount,
      },
    }),
  };

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    ...categoryChain.map((cat) => ({
      label: cat.name,
      href: `/catalog/${cat.slug}`,
    })),
    { label: product.name },
  ];

  const variants = product.variants.map((v) => ({
    id: v.id,
    name: v.name,
    sku: v.sku,
    price: v.price == null ? null : Number(v.price),
    quantity: v.quantity,
    options: (v.options && typeof v.options === "object" && !Array.isArray(v.options)
      ? Object.fromEntries(Object.entries(v.options).map(([k, val]) => [k, String(val ?? "")]))
      : {}) as Record<string, string>,
  }));

  return (
    <div className="hw-container pb-24">
      <JsonLd data={jsonLd} />

      <Breadcrumbs items={breadcrumbItems} />

      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-16">
        <ProductGallery images={product.images} productName={product.name} />
        <div className="md:sticky md:top-[calc(var(--header-height)+1.5rem)]">
          <ProductInfo
            id={product.id}
            name={product.name}
            slug={product.slug}
            sku={product.sku}
            price={Number(product.price)}
            comparePrice={product.comparePrice ? Number(product.comparePrice) : null}
            quantity={product.quantity}
            shortDescription={product.shortDescription}
            description={product.description}
            brand={product.brand}
            condition={product.condition}
            lowStockAlert={product.lowStockAlert}
            imageUrl={product.images[0]?.url}
            ean={product.ean}
            reviewCount={reviewCount}
            avgRating={avgRating}
            categoryPath={categoryChain}
            variants={variants}
          />
        </div>
      </div>

      <ProductTabs
        description={product.description}
        characteristics={characteristics}
        reviews={product.reviews.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
