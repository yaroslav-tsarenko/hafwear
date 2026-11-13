import type { Prisma } from "@prisma/client";
import productsWithoutPhotos from "@/data/products-without-photos.json";

/**
 * Products whose photos all still show the old print and are therefore hidden
 * (src/data/hidden-images.json). With nothing left to show they are kept out of
 * the storefront entirely — listings, search, feeds and the sitemap — instead of
 * appearing as empty "Photo coming soon" cards.
 *
 * Carts and the admin keep seeing them: an order already placed must still work.
 * The list is rebuilt by scripts/build-products-without-photos.ts and empties
 * itself as photos are regenerated.
 */
const WITHOUT_PHOTOS = productsWithoutPhotos as string[];

/** Spread into any storefront `where` that lists products. */
export const hasVisiblePhoto: Prisma.ProductWhereInput = WITHOUT_PHOTOS.length
  ? { images: { some: {} }, id: { notIn: WITHOUT_PHOTOS } }
  : { images: { some: {} } };

export function isHiddenProduct(id: string): boolean {
  return WITHOUT_PHOTOS.includes(id);
}
