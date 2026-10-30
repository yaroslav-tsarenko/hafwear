import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { absoluteImageUrl } from "@/lib/media";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        categories: { include: { category: { select: { name: true } } } },
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hafwear.com";

    const feed = products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      slug: product.slug,
      description: product.description,
      price: Number(product.price),
      comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
      currency: "GBP",
      availability: product.quantity > 0 ? "in_stock" : "out_of_stock",
      quantity: product.quantity,
      condition: product.condition,
      brand: product.brand,
      gtin: product.gtin,
      categories: product.categories.map((c) => c.category.name),
      images: product.images.map((img) => absoluteImageUrl(img.url, siteUrl)),
      url: `${siteUrl}/en/product/${product.slug}`,
      updatedAt: product.updatedAt,
    }));

    return NextResponse.json({ products: feed, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Error generating generic feed:", error);
    return NextResponse.json({ error: "Failed to generate feed" }, { status: 500 });
  }
}
