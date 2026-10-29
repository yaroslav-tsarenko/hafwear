import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { brand } from "@/lib/brand";
import { JsonLd } from "@/components/shared/SEO/JsonLd";
import { HomeHero } from "@/components/home/HomeHero";
import { DepartmentTiles, type DepartmentTile } from "@/components/home/DepartmentTiles";
import { ProductRow } from "@/components/home/ProductRow";
import { StoryBlock } from "@/components/home/StoryBlock";
import { CategoryIndex, type CategoryIndexItem } from "@/components/home/CategoryIndex";
import { Promises } from "@/components/home/Promises";
import type { CardProduct } from "@/components/product/ProductCard/ProductCard";

export const revalidate = 60;

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    alternates: { canonical: `/${locale}` },
    openGraph: { url: `/${locale}` },
  };
}

// Minimal product columns for card rendering — two images for the hover swap.
const cardSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  comparePrice: true,
  quantity: true,
  images: {
    select: { url: true, alt: true },
    orderBy: { sortOrder: "asc" as const },
    take: 2,
  },
  categories: {
    select: { category: { select: { name: true } } },
    take: 1,
  },
} satisfies Prisma.ProductSelect;

type CategoryFlat = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  parentId: string | null;
};

type CategoryNode = CategoryFlat & {
  children: CategoryNode[];
  total: number;
};

const getActiveCategoriesFlat = unstable_cache(
  async (): Promise<CategoryFlat[]> =>
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, imageUrl: true, parentId: true },
    }),
  ["home-active-categories-v2"],
  { revalidate: 300, tags: ["categories"] },
);

const getCategoryProductCounts = unstable_cache(
  async (): Promise<Array<[string, number]>> => {
    const grouped = await prisma.productCategory.groupBy({
      by: ["categoryId"],
      where: { product: { status: "ACTIVE", images: { some: {} } } },
      _count: { productId: true },
    });
    return grouped.map((row) => [row.categoryId, row._count.productId] as [string, number]);
  },
  ["home-category-product-counts-v2"],
  { revalidate: 60, tags: ["products", "categories"] },
);

function buildTree(categories: CategoryFlat[], counts: Map<string, number>): CategoryNode[] {
  const nodes = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];
  for (const c of categories) nodes.set(c.id, { ...c, children: [], total: 0 });
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const fill = (n: CategoryNode): number => {
    n.total = (counts.get(n.id) || 0) + n.children.reduce((s, c) => s + fill(c), 0);
    return n.total;
  };
  roots.forEach(fill);
  return roots;
}

function findBySlug(nodes: CategoryNode[], slug: string): CategoryNode | undefined {
  for (const n of nodes) {
    if (n.slug === slug) return n;
    const found = findBySlug(n.children, slug);
    if (found) return found;
  }
  return undefined;
}

function descendantIds(node: CategoryNode): string[] {
  return [node.id, ...node.children.flatMap(descendantIds)];
}

const visible: Prisma.ProductWhereInput = { status: "ACTIVE", images: { some: {} } };

async function coverImage(node: CategoryNode): Promise<string | null> {
  if (node.imageUrl) return node.imageUrl;
  const product = await prisma.product.findFirst({
    where: { ...visible, categories: { some: { categoryId: { in: descendantIds(node) } } } },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    select: { images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 } },
  });
  return product?.images[0]?.url ?? null;
}

function serialize<T>(rows: T): CardProduct[] {
  return JSON.parse(JSON.stringify(rows)) as CardProduct[];
}

const DEPARTMENTS = [
  { label: "Women", slug: "women" },
  { label: "Men", slug: "men" },
  { label: "Kids", slug: "kids" },
  { label: "Swim", slug: "women-swimwear" },
];

async function getHomeData() {
  try {
    const [categoriesFlat, counts, featured, newest, popular, saleCandidates] = await Promise.all([
      getActiveCategoriesFlat(),
      getCategoryProductCounts().then((entries) => new Map(entries)),
      prisma.product.findFirst({
        where: { ...visible, isFeatured: true },
        orderBy: { createdAt: "desc" },
        select: cardSelect,
      }),
      prisma.product.findMany({ where: visible, orderBy: { createdAt: "desc" }, take: 9, select: cardSelect }),
      prisma.product.findMany({
        where: visible,
        orderBy: [{ orderItems: { _count: "desc" } }, { isFeatured: "desc" }, { createdAt: "desc" }],
        take: 8,
        select: cardSelect,
      }),
      prisma.product.findMany({
        where: { ...visible, comparePrice: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 24,
        select: cardSelect,
      }),
    ]);

    const tree = buildTree(categoriesFlat, counts);

    const departmentNodes = DEPARTMENTS.map((d) => ({ ...d, node: findBySlug(tree, d.slug) })).filter(
      (d): d is typeof d & { node: CategoryNode } => !!d.node && d.node.total > 0,
    );

    // Second-level categories make the most useful index (Women › T-shirts, Kids › Hoodies…).
    const indexNodes = tree
      .flatMap((root) => root.children.map((child) => ({ root, child })))
      .filter(({ child }) => child.total > 0)
      .sort((a, b) => b.child.total - a.child.total)
      .slice(0, 10);

    const [departmentImages, indexImages] = await Promise.all([
      Promise.all(departmentNodes.map((d) => coverImage(d.node))),
      Promise.all(indexNodes.map(({ child }) => coverImage(child))),
    ]);

    const departments: DepartmentTile[] = departmentNodes.map((d, i) => ({
      label: d.label,
      href: `/catalog/${d.slug}`,
      imageUrl: departmentImages[i],
      count: d.node.total,
    }));

    const categoryIndex: CategoryIndexItem[] = indexNodes.map(({ root, child }, i) => ({
      id: child.id,
      label: `${root.name} · ${child.name}`,
      slug: child.slug,
      imageUrl: indexImages[i],
      count: child.total,
    }));

    const heroProduct = featured ?? newest[0] ?? null;
    const newProducts = newest.filter((p) => p.id !== heroProduct?.id).slice(0, 8);
    const saleProducts = saleCandidates
      .filter((p) => Number(p.comparePrice) > Number(p.price))
      .slice(0, 4);

    return {
      heroProduct: heroProduct ? serialize([heroProduct])[0] : null,
      departments,
      newProducts: serialize(newProducts),
      popularProducts: serialize(popular),
      saleProducts: serialize(saleProducts),
      categoryIndex,
    };
  } catch (e) {
    console.error("Homepage data fetch error:", e);
    return {
      heroProduct: null,
      departments: [],
      newProducts: [],
      popularProducts: [],
      saleProducts: [],
      categoryIndex: [],
    };
  }
}

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: brand.displayName,
          legalName: brand.company.legalName,
          alternateName: [brand.domain],
          url: brand.url,
          email: brand.contact.email,
          description: brand.description,
          address: {
            "@type": "PostalAddress",
            streetAddress: `${brand.company.address.line1}, ${brand.company.address.line2}`,
            addressLocality: brand.company.address.city,
            addressRegion: brand.company.address.region,
            postalCode: brand.company.address.postcode,
            addressCountry: "GB",
          },
        }}
      />
      <HomeHero product={data.heroProduct} />
      <DepartmentTiles tiles={data.departments} />
      <ProductRow
        title="New in"
        subtitle="Fresh from the studio this week."
        products={data.newProducts}
        viewAllHref="/catalog?sort=newest"
        viewAllLabel="Shop all new in"
      />
      <StoryBlock />
      <CategoryIndex items={data.categoryIndex} />
      <ProductRow
        title="Most loved"
        products={data.popularProducts}
        viewAllHref="/catalog?sort=popular"
      />
      <ProductRow
        title="On sale"
        products={data.saleProducts}
        viewAllHref="/catalog?onSale=true"
        viewAllLabel="Shop the sale"
      />
      <Promises />
    </>
  );
}
