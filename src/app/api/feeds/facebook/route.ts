import { NextResponse } from "next/server";
import { rebrand } from "@/lib/brand";
import { prisma } from "@/lib/prisma";
import { absoluteImageUrl, visibleImages } from "@/lib/media";
import { hasVisiblePhoto } from "@/lib/visible-products";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE", ...hasVisiblePhoto },
      // Several photos, because the leading ones may be hidden (see visibleImages).
      include: { images: { orderBy: { sortOrder: "asc" }, take: 8 } },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hafwear.com";

    const headers = [
      "id", "title", "description", "availability", "condition",
      "price", "link", "image_link", "brand", "gtin",
    ];

    const rows = products.map((product) => [
      product.id,
      rebrand(product.name),
      (product.description || rebrand(product.name)).replace(/,/g, " "),
      product.quantity > 0 ? "in stock" : "out of stock",
      product.condition,
      `${Number(product.price).toFixed(2)} EUR`,
      `${siteUrl}/en/product/${product.slug}`,
      absoluteImageUrl(visibleImages(product.images)[0]?.url, siteUrl),
      product.brand || "",
      product.gtin || "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=facebook-feed.csv",
      },
    });
  } catch (error) {
    console.error("Error generating Facebook feed:", error);
    return NextResponse.json({ error: "Failed to generate feed" }, { status: 500 });
  }
}
