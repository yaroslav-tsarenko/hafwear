/**
 * Builds src/data/hidden-images.json: every catalogue photo still showing the old
 * "RAVORA" print that we have not regenerated yet.
 *
 * The store is live, so a photo in that state must not reach a shopper — the
 * site hides it (see visibleImages in src/lib/media.ts) and shows the next clean
 * photo of that product, or a placeholder if it has none left.
 *
 * Run this before every commit while the regeneration is still going: as photos
 * land in rebranded-images.json they drop out of this list by themselves.
 *
 *   npx tsx scripts/build-hidden-images.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const SCAN = path.resolve("tmp/rebrand/scan.jsonl");
const REBRANDED = path.resolve("src/data/rebranded-images.json");
const OUT = path.resolve("src/data/hidden-images.json");

const withOldPrint = readFileSync(SCAN, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((l) => JSON.parse(l) as { hash: string; ravora: boolean })
  .filter((r) => r.ravora)
  .map((r) => r.hash);

const done = new Set<string>(JSON.parse(readFileSync(REBRANDED, "utf8")));
const hidden = withOldPrint.filter((h) => !done.has(h)).sort();

writeFileSync(OUT, JSON.stringify(hidden) + "\n");
console.log(`${withOldPrint.length} photos had the old print; ${done.size} regenerated, ${hidden.length} hidden for now`);
