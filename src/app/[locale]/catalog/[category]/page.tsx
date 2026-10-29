import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { ProductGrid } from "@/components/product/ProductGrid/ProductGrid";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { getDescendantCategoryIds } from "@/lib/category-tree";

export const revalidate = 60;

const PAGE_SIZE = 60;

interface CategoryPageProps {
  params: Promise<{ category: string; locale: string }>;
  searchParams?: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category: slug, locale } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true, description: true, slug: true },
  });

  if (!category) return {};

  return {
    title: category.name,
    description:
      category.description ||
      `Shop ${category.name} at Hafwear. Browse premium made-to-order apparel — tees, hoodies, sweatshirts and more.`,
    alternates: { canonical: `/${locale}/catalog/${category.slug}` },
    openGraph: {
      title: `${category.name} | Hafwear`,
      description:
        category.description ||
        `Shop ${category.name} products at Hafwear.`,
      url: `/${locale}/catalog/${category.slug}`,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category: slug, locale } = await params;
  const sp = (await searchParams) || {};
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);

  const category = await prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      description: true,
      slug: true,
      parent: { select: { name: true, slug: true } },
      children: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, slug: true },
      },
    },
  });

  // Unknown/stale category slugs land on the full catalog instead of dead-ending on a 404.
  if (!category) redirect(`/${locale}/catalog`);

  const categoryIds = await getDescendantCategoryIds(category.id);

  const where = {
    status: "ACTIVE" as const,
    images: { some: {} },
    categories: { some: { categoryId: { in: categoryIds } } },
  };

  const [productsRaw, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        price: true,
        comparePrice: true,
        quantity: true,
        images: {
          select: { url: true, alt: true },
          orderBy: { sortOrder: "asc" },
          take: 2,
        },
        categories: {
          select: { category: { select: { name: true } } },
          take: 1,
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const products = productsRaw.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    price: Number(p.price),
    comparePrice: p.comparePrice == null ? null : Number(p.comparePrice),
    quantity: p.quantity,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
    categories: p.categories.map((pc) => ({ category: { name: pc.category.name } })),
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const basePath = `/${locale}/catalog/${category.slug}`;

  const pageHref = (n: number) => (n > 1 ? `${basePath}?page=${n}` : basePath);

  return (
    <div className="hw-container pb-24 [overflow-wrap:anywhere]">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          ...(category.parent
            ? [{ label: category.parent.name, href: `/catalog/${category.parent.slug}` }]
            : [{ label: "Shop", href: "/catalog" }]),
          { label: category.name },
        ]}
      />

      <header className="flex flex-col gap-6 pb-10 pt-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          {category.parent && (
            <p className="mb-3 text-[12px] uppercase tracking-[0.12em] text-[color:var(--color-text-tertiary)]">
              {category.parent.name}
            </p>
          )}
          <h1 className="break-words font-serif text-[48px] leading-[0.98] sm:text-[64px]">{category.name}</h1>
          {category.description && (
            <p className="mt-4 text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
              {category.description}
            </p>
          )}
        </div>
        <p className="text-[13px] tabular-nums text-[color:var(--color-text-tertiary)]">
          {total.toLocaleString()} product{total === 1 ? "" : "s"}
        </p>
      </header>

      {category.children.length > 0 && (
        <nav aria-label="Subcategories" className="scrollbar-none -mx-1 mb-10 flex gap-2 overflow-x-auto px-1">
          <span className="inline-flex h-9 shrink-0 items-center rounded-full bg-[color:var(--color-primary)] px-4 text-[13px] text-[color:var(--color-primary-fg)]">
            All
          </span>
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/catalog/${child.slug}`}
              className="inline-flex h-9 shrink-0 items-center rounded-full border border-[color:var(--color-border)] px-4 text-[13px] transition-colors hover:border-[color:var(--color-text)]"
            >
              {child.name}
            </Link>
          ))}
        </nav>
      )}

      <ProductGrid products={products} columns={4} />

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-6 text-[14px]">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="hw-link">
              Previous
            </Link>
          ) : (
            <span className="text-[color:var(--color-text-tertiary)]">Previous</span>
          )}
          <span className="tabular-nums text-[color:var(--color-text-secondary)]">
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="hw-link">
              Next
            </Link>
          ) : (
            <span className="text-[color:var(--color-text-tertiary)]">Next</span>
          )}
        </nav>
      )}
    </div>
  );
}
