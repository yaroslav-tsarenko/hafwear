/**
 * Builds src/data/variant-images.json: for every product, which gallery photos
 * belong to which colour, so the product page can switch photos when a shopper
 * picks a colour.
 *
 * The WooCommerce export knows the colour of each photo (the variation image,
 * and the colour slug in every Printful filename), but the import kept only a
 * flat photo list. Photos now live on R2 under a key that is the sha1 of the
 * original images.ravora.co.uk URL (see ~/Projects/catalog-r2), so the key can
 * be recomputed here without touching the database.
 *
 * Usage: npx tsx scripts/build-variant-images.ts [path/to/export.csv]
 * Output: { [productSku]: { option: "Color", images: { [colour]: [r2Hash, ...] } } }
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import Papa from "papaparse";

type Row = Record<string, string>;

const csvPath =
  process.argv[2] ??
  path.join("data", readdirSync("data").find((f) => f.startsWith("wc-product-export") && f.endsWith(".csv"))!);
const outPath = path.join("src", "data", "variant-images.json");

const rows = Papa.parse<Row>(readFileSync(csvPath, "utf8"), { header: true, skipEmptyLines: true }).data;

const split = (s: string | undefined) => (s ?? "").split(",").map((x) => x.trim()).filter(Boolean);
const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** R2 key hash for a photo, matching catalog-r2's export (sha1 of host+path on images.ravora.co.uk). */
function r2Hash(url: string): string | null {
  const m = url.match(/\/wp-content\/uploads\/.+$/i);
  if (!m) return null;
  const normalised = `images.ravora.co.uk${m[0].split("#")[0]}`.toLowerCase();
  return createHash("sha1").update(normalised).digest("hex").slice(0, 20);
}

const fileName = (url: string) => url.split("/").pop()!.toLowerCase();

const variations = new Map<string, Row[]>();
for (const r of rows) {
  if (r.Type !== "variation") continue;
  const list = variations.get(r.Parent) ?? [];
  list.push(r);
  variations.set(r.Parent, list);
}

const out: Record<string, { option: string; images: Record<string, string[]> }> = {};
let mappedProducts = 0;

for (const p of rows) {
  if (p.Type !== "variable") continue;
  // Same SKU rule as scripts/import-woocommerce.ts.
  const sku = p.SKU || `WC-${p.ID}`;
  const vs = [...(variations.get(`id:${p.ID}`) ?? []), ...(p.SKU ? variations.get(p.SKU) ?? [] : [])];
  if (!vs.length) continue;

  // Which attribute is the colour?
  const attrIndex = [1, 2].find((i) => /colou?r/i.test(p[`Attribute ${i} name`] ?? ""));
  if (!attrIndex) continue;
  const option = p[`Attribute ${attrIndex} name`];

  const colours = [...new Set(vs.map((v) => v[`Attribute ${attrIndex} value(s)`]).filter(Boolean))];
  if (colours.length < 2) continue;

  // Longest colour slug first, so "black-heather" wins over "black".
  const bySlug = colours.map((c) => ({ c, s: slug(c) })).sort((a, b) => b.s.length - a.s.length);
  const colourOf = (url: string) => {
    const f = fileName(url);
    return bySlug.find(({ s }) => s && f.includes(`-${s}-`))?.c;
  };

  const images: Record<string, string[]> = {};
  const push = (colour: string, url: string, front = false) => {
    const h = r2Hash(url);
    if (!h) return;
    const list = (images[colour] ??= []);
    if (list.includes(h)) return;
    if (front) list.unshift(h);
    else list.push(h);
  };

  // Gallery photos whose filename names a colour.
  for (const url of split(p.Images)) {
    const c = colourOf(url);
    if (c) push(c, url);
  }
  // The variation's own photo leads that colour's set.
  for (const v of vs) {
    const c = v[`Attribute ${attrIndex} value(s)`];
    const url = split(v.Images)[0];
    if (c && url) push(c, url, true);
  }

  if (Object.keys(images).length >= 2) {
    out[sku] = { option, images };
    mappedProducts++;
  }
}

mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(out));
console.log(`Mapped ${mappedProducts} products → ${outPath} (${(JSON.stringify(out).length / 1024).toFixed(0)} KB)`);
