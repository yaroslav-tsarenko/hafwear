import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rebrand } from "@/lib/brand";
import { hasVisiblePhoto } from "@/lib/visible-products";
import { visibleImages } from "@/lib/media";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    // Names in the shared catalogue still carry the old brand; let "hafwear" find them.
    const dbQuery = query.replace(/hafwear/gi, "ravora");
    const products = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        ...hasVisiblePhoto,
        OR: [
          { name: { contains: dbQuery, mode: "insensitive" } },
          { sku: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { brand: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        // More than the one shown: the first photos may be hidden ones.
        images: { take: 8, orderBy: { sortOrder: "asc" } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      products.map((p) => ({ ...p, name: rebrand(p.name), images: visibleImages(p.images).slice(0, 1) })),
      {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
