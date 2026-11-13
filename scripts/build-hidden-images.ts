/**
 * Builds src/data/hidden-images.json: every catalogue photo still showing the old
 * "RAVORA" print that we have not regenerated yet.
 *
 * Three sources, because one is not enough:
 *  1. tmp/rebrand/scan.jsonl — what the vision scan saw on each photo.
 *  2. Products that still name RAVORA in their title or copy. These are the
 *     all-over-print garments whose artwork IS the old wordmark, and the scan
 *     read it as just another graphic, so it never flagged them.
 *  3. src/data/missed-print-products.json — products confirmed by eye to carry
 *     the wordmark while being named something generic ("Leggings").
 *
 * The store is live, so a photo in that state must not reach a shopper — the
 * site hides it (see visibleImages in src/lib/media.ts) and shows the next clean
 * photo of that product, or drops the product from the storefront if it has none
 * left (see scripts/build-products-without-photos.ts).
 *
 * Run this before every commit while the regeneration is still going: as photos
 * land in rebranded-images.json they drop out of this list by themselves.
 *
 *   npx tsx scripts/build-hidden-images.ts
 */
import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "../src/lib/prisma";

const SCAN = path.resolve("tmp/rebrand/scan.jsonl");
const REBRANDED = path.resolve("src/data/rebranded-images.json");
const CONFIRMED = path.resolve("src/data/missed-print-products.json");
const OUT = path.resolve("src/data/hidden-images.json");

async function main() {
  const scanned = readFileSync(SCAN, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as { hash: string; ravora: boolean })
    .filter((r) => r.ravora)
    .map((r) => r.hash);

  const confirmed: string[] = JSON.parse(readFileSync(CONFIRMED, "utf8"));
  const branded = await prisma.product.findMany({
    where: {
      OR: [
        { id: { in: confirmed } },
        { name: { contains: "ravora", mode: "insensitive" } },
        { description: { contains: "ravora", mode: "insensitive" } },
        { shortDescription: { contains: "ravora", mode: "insensitive" } },
      ],
    },
    select: { images: { select: { url: true } } },
  });
  const fromProducts = branded
    .flatMap((p) => p.images)
    .map((i) => i.url.match(/img\/([0-9a-f]{20})-/)?.[1])
    .filter((h): h is string => !!h);

  const done = new Set<string>(JSON.parse(readFileSync(REBRANDED, "utf8")));
  const withOldPrint = new Set<string>([...scanned, ...fromProducts]);
  const hidden = [...withOldPrint].filter((h) => !done.has(h)).sort();

  writeFileSync(OUT, JSON.stringify(hidden) + "\n");
  console.log(
    `${withOldPrint.size} photos had the old print ` +
      `(${scanned.length} from the scan, ${new Set(fromProducts).size} from branded products); ` +
      `${hidden.length} hidden for now`,
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
