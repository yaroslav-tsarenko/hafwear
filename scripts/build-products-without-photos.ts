/**
 * Builds src/data/products-without-photos.json: products whose every photo is
 * hidden (see scripts/build-hidden-images.ts), so nothing is left to show.
 *
 * The storefront leaves these out entirely rather than printing "Photo coming
 * soon" over an empty tile — a product nobody can see is better than a row of
 * blank cards. They come back on their own as their photos are regenerated.
 *
 * Run after build-hidden-images.ts, before committing:
 *   npx tsx scripts/build-products-without-photos.ts
 */
import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "../src/lib/prisma";

const HIDDEN = path.resolve("src/data/hidden-images.json");
const OUT = path.resolve("src/data/products-without-photos.json");

async function main() {
  const hidden = new Set<string>(JSON.parse(readFileSync(HIDDEN, "utf8")));
  const images = await prisma.productImage.findMany({ select: { url: true, productId: true } });

  const total = new Map<string, number>();
  const gone = new Map<string, number>();
  for (const { url, productId } of images) {
    total.set(productId, (total.get(productId) ?? 0) + 1);
    const hash = url.match(/img\/([0-9a-f]{20})-/)?.[1];
    if (hash && hidden.has(hash)) gone.set(productId, (gone.get(productId) ?? 0) + 1);
  }

  const empty = [...gone.entries()].filter(([id, n]) => n === total.get(id)).map(([id]) => id).sort();
  writeFileSync(OUT, JSON.stringify(empty) + "\n");
  console.log(`${empty.length} products have no photo left and are hidden from the storefront`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
