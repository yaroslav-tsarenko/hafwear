/**
 * Printful half of the photo rebrand (the OpenAI half is scripts/rebrand-photos.ts).
 *
 * Every catalogue photo is itself an old Printful mockup, so its filename still
 * names the garment, the colour and the view — e.g.
 * unisex-staple-t-shirt-black-front-<id>.jpg. That lets us ask Printful for the
 * same mockup again with the Hafwear logo as the print, which beats repainting
 * the old photo: it is a real product shot of the garment we actually sell.
 *
 *   npx tsx scripts/rebrand-mockups.ts plan   # what each photo would get, no calls
 *   npx tsx scripts/rebrand-mockups.ts run [--limit N]
 *
 * Photos we hand back to the OpenAI script: all-over-print garments (their art
 * covers the whole garment and we don't have the original file) and anything
 * whose garment is not in Printful's catalogue any more.
 *
 * Results land in the same place as the OpenAI ones — R2 products/rebrand/<hash>
 * and src/data/rebranded-images.json — so the site needs no further change.
 */
import "dotenv/config";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const OUT = path.resolve("tmp/rebrand");
const LOG = path.join(OUT, "mockup.jsonl");
const MAP_FILE = path.resolve("src/data/rebranded-images.json");
const PLAN_FILE = path.join(OUT, "mockup-plan.json");
const CDN = "https://img.ravora.co.uk/ravora/img";
const SITE = process.env.REBRAND_PRINT_ORIGIN || "https://www.hafwear.com";
const PRINT = {
  dark: `${SITE}/media/products/brand/hafwear-print-dark.png`,
  light: `${SITE}/media/products/brand/hafwear-print-light.png`,
};
const STORE = process.env.PRINTFUL_STORE_ID!;
const TOKEN = process.env.PRINTFUL_TOKEN!;
/** Mockup Generator allows 2–10 task creations a minute; stay under it. */
const TASK_INTERVAL_MS = Number(process.env.REBRAND_TASK_INTERVAL_MS || 30_000);

type Scan = { hash: string; ravora: boolean; person: boolean };
type Variant = { id: number; color: string; size: string; color_code: string | null };
type Style = { id: number; category_name: string; view_name: string };
type Group = {
  productId: number;
  productSlug: string;
  placement: "front" | "back";
  person: boolean;
  /** colour slug → photo hashes wanting that colour in this view */
  colors: Record<string, string[]>;
};

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const slugify = (s: string) =>
  s.toLowerCase().replace(/\|.*$/, "").replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function pf<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`https://api.printful.com${url}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "X-PF-Store-Id": STORE,
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
    if (res.status === 429 && attempt < 6) {
      const wait = Number(res.headers.get("Retry-After") || 20) * 1000;
      await new Promise((r) => setTimeout(r, wait + 1000));
      continue;
    }
    const json = (await res.json()) as T & { error?: { message: string } };
    if (!res.ok) throw new Error(`Printful ${res.status} ${url}: ${json?.error?.message ?? "error"}`);
    return json;
  }
}

/** Printful mockups are lit on a white set, so mid-tones still read as "light". */
function isDarkGarment(hex: string | null): boolean {
  if (!hex) return false;
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return false;
  const [r, g, b] = m.slice(1).map((x) => parseInt(x, 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.45;
}

const variantCache = new Map<number, Variant[]>();
async function variantsOf(productId: number): Promise<Variant[]> {
  if (variantCache.has(productId)) return variantCache.get(productId)!;
  const out: Variant[] = [];
  for (let offset = 0; ; offset += 100) {
    const j = await pf<{ data: Variant[] }>(
      `/v2/catalog-products/${productId}/catalog-variants?limit=100&offset=${offset}`,
    );
    out.push(...j.data);
    if (j.data.length < 100) break;
  }
  variantCache.set(productId, out);
  return out;
}

type StyleGroup = { placement: string; technique?: string; print_area_width: number; print_area_height: number; mockup_styles: Style[] };
const styleCache = new Map<number, StyleGroup[]>();
async function stylesOf(productId: number) {
  if (!styleCache.has(productId)) {
    const j = await pf<{ data: StyleGroup[] }>(
      `/v2/catalog-products/${productId}/mockup-styles`,
    );
    styleCache.set(productId, j.data);
  }
  return styleCache.get(productId)!;
}

/**
 * Not every garment takes a plain printed logo on the chest: a sports tee is
 * DTF, an urban sweatshirt is embroidery only, a pocket tee prints on the
 * pocket, fleece shorts on the leg. Pick the closest placement the garment
 * actually offers for this view, and print it the way that placement wants.
 */
const PLACEMENTS = {
  front: ["front", "front_large", "front_dtf", "pocket", "embroidery_chest_center", "embroidery_chest_left", "leg_front_left", "leg_front_right"],
  back: ["back", "back_dtf", "embroidery_back", "leg_back_left", "leg_back_right"],
} as const;

async function resolvePlacement(productId: number, view: "front" | "back", person: boolean) {
  const groups = await stylesOf(productId);
  const viewName = view === "back" ? "Back" : "Front";
  const ranked = [...groups].sort(
    (a, b) => rank(PLACEMENTS[view], a.placement) - rank(PLACEMENTS[view], b.placement),
  );
  const group = ranked.find(
    (g) => rank(PLACEMENTS[view], g.placement) < 99 && g.mockup_styles.some((s) => s.view_name === viewName),
  );
  if (!group) return null;

  const inView = group.mockup_styles.filter((s) => s.view_name === viewName);
  const plain = ["Flat", "Ghost", "On Hanger", "Wrinkled", "Folded"];
  const style = person
    ? inView.find((s) => /Lifestyle|Men's|Women's/.test(s.category_name) && !plain.includes(s.category_name))
    : inView.find((s) => plain.includes(s.category_name)) ?? inView.find((s) => /Ghost|Flat/.test(s.category_name));

  // A chest-width logo as a share of the garment's own print area: a toddler tee
  // prints 8x10 inches, an adult tee 12x16, and a fixed size is rejected on the small ones.
  const areaWidth = group.print_area_width ?? 12;
  const areaHeight = group.print_area_height ?? 16;
  const width = Math.round(Math.min(areaWidth * 0.35, areaWidth) * 100) / 100;
  const height = Math.round(Math.min(width / 3, areaHeight) * 100) / 100;

  return {
    placement: group.placement,
    technique: group.technique ?? "dtg",
    styleId: (style ?? inView[0]).id,
    position: {
      area_width: areaWidth,
      area_height: areaHeight,
      width,
      height,
      top: Math.round(Math.min(areaHeight * 0.2, areaHeight - height) * 100) / 100,
      left: Math.round(((areaWidth - width) / 2) * 100) / 100,
    },
  };
}

function rank(order: readonly string[], placement: string): number {
  const i = order.indexOf(placement);
  return i === -1 ? 99 : i;
}

/** Group the photos we can redo in Printful by product + view, so one task covers many colours. */
async function buildPlan() {
  const catalog: { id: number; name: string }[] = JSON.parse(
    await readFile(path.join(OUT, "printful-catalog.json"), "utf8"),
  );
  const products = catalog.map((p) => ({ ...p, slug: slugify(p.name) })).sort((a, b) => b.slug.length - a.slug.length);
  const h2f: Record<string, string> = JSON.parse(await readFile(path.join(OUT, "hash-to-file.json"), "utf8"));
  const scan = new Map(
    (await readFile(path.join(OUT, "scan.jsonl"), "utf8"))
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l) as Scan)
      .map((r) => [r.hash, r]),
  );

  const groups = new Map<string, Group>();
  const toOpenAI: { hash: string; why: string }[] = [];

  for (const [hash, file] of Object.entries(h2f)) {
    if (file.startsWith("all-over-print")) {
      toOpenAI.push({ hash, why: "all-over print — we don't have the original artwork" });
      continue;
    }
    const product = products.find((p) => file.startsWith(p.slug + "-"));
    if (!product) {
      toOpenAI.push({ hash, why: "garment not in Printful's catalogue" });
      continue;
    }
    const rest = file.slice(product.slug.length + 1).replace(/-[0-9a-f]{10,}$/, "");
    const viewMatch = rest.match(/-(front|back|left|right)(-\d+)?$/);
    const view = viewMatch?.[1];
    if (view !== "front" && view !== "back") {
      toOpenAI.push({ hash, why: `view "${rest}" has no matching mockup` });
      continue;
    }
    const color = rest.slice(0, rest.length - viewMatch![0].length);
    if (!color) {
      toOpenAI.push({ hash, why: "no colour in filename" });
      continue;
    }
    const person = scan.get(hash)?.person ?? false;
    const key = `${product.id}:${view}:${person}`;
    const g =
      groups.get(key) ??
      ({ productId: product.id, productSlug: product.slug, placement: view, person, colors: {} } as Group);
    (g.colors[color] ??= []).push(hash);
    groups.set(key, g);
  }

  return { groups: [...groups.values()], toOpenAI };
}

async function upload(key: string, body: Buffer) {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

/** The OpenAI script writes this file too, so merge instead of overwriting. */
async function saveHashes(hashes: Set<string>) {
  const onDisk: string[] = existsSync(MAP_FILE) ? JSON.parse(await readFile(MAP_FILE, "utf8")) : [];
  for (const h of onDisk) hashes.add(h);
  await writeFile(MAP_FILE, JSON.stringify([...hashes].sort()) + "\n");
}

async function run(limit?: number) {
  const { groups, toOpenAI } = await buildPlan();
  const done = new Set(
    (existsSync(LOG) ? (await readFile(LOG, "utf8")).split("\n").filter(Boolean) : [])
      .map((l) => JSON.parse(l) as { key: string; ok: boolean })
      .filter((r) => r.ok)
      .map((r) => r.key),
  );
  const mapped = new Set<string>(existsSync(MAP_FILE) ? JSON.parse(await readFile(MAP_FILE, "utf8")) : []);
  let todo = groups.filter((g) => !done.has(`${g.productId}:${g.placement}:${g.person}`));
  if (limit) todo = todo.slice(0, limit);
  console.log(`${groups.length} mockup groups, ${done.size} done, ${todo.length} to run; ${toOpenAI.length} photos stay with OpenAI`);

  for (const [i, g] of todo.entries()) {
    const key = `${g.productId}:${g.placement}:${g.person}`;
    const started = Date.now();
    try {
      const [variants, target] = await Promise.all([
        variantsOf(g.productId),
        resolvePlacement(g.productId, g.placement, g.person),
      ]);
      if (!target) throw new Error(`this garment has no printable placement for ${g.placement}`);

      // One variant per wanted colour (any size — the mockup is the same).
      const byColor = new Map<string, Variant>();
      for (const v of variants) {
        const slug = slugify(v.color);
        if (!byColor.has(slug)) byColor.set(slug, v);
      }
      const chosen: { hash: string[]; variant: Variant }[] = [];
      const unmatched: string[] = [];
      for (const [color, hashes] of Object.entries(g.colors)) {
        const v = byColor.get(color);
        if (v) chosen.push({ hash: hashes, variant: v });
        else unmatched.push(...hashes);
      }
      if (!chosen.length) throw new Error("no colours matched this product's variants");

      // Dark and light garments need different ink, so they go in separate tasks.
      const lanes = [
        { dark: true, items: chosen.filter((c) => isDarkGarment(c.variant.color_code)) },
        { dark: false, items: chosen.filter((c) => !isDarkGarment(c.variant.color_code)) },
      ].filter((l) => l.items.length);

      let saved = 0;
      for (const lane of lanes) {
        const task = await pf<{ data: { id: number }[] }>("/v2/mockup-tasks", {
          method: "POST",
          body: JSON.stringify({
            format: "jpg",
            products: [
              {
                source: "catalog",
                catalog_product_id: g.productId,
                catalog_variant_ids: lane.items.map((c) => c.variant.id),
                mockup_style_ids: [target.styleId],
                placements: [
                  {
                    placement: target.placement,
                    technique: target.technique,
                    layers: [
                      {
                        type: "file",
                        url: lane.dark ? PRINT.light : PRINT.dark,
                        position: target.position,
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        });
        const taskId = task.data[0].id;

        let result: { status: string; catalog_variant_mockups?: { catalog_variant_id: number; mockups: { mockup_url: string }[] }[]; failure_reasons?: string[] } | undefined;
        for (let waited = 0; waited < 240_000; waited += 5000) {
          await new Promise((r) => setTimeout(r, 5000));
          const j = await pf<{ data: typeof result[] }>(`/v2/mockup-tasks?id=${taskId}`);
          result = j.data[0]!;
          if (result!.status !== "pending") break;
        }
        if (result?.status !== "completed") throw new Error(`task ${taskId}: ${result?.status} ${result?.failure_reasons?.join("; ") ?? ""}`);

        for (const vm of result.catalog_variant_mockups ?? []) {
          const item = lane.items.find((c) => c.variant.id === vm.catalog_variant_id);
          const url = vm.mockups[0]?.mockup_url;
          if (!item || !url) continue;
          const src = Buffer.from(await (await fetch(url)).arrayBuffer());
          for (const hash of item.hash) {
            for (const w of [800, 400] as const) {
              const webp = await sharp(src).resize(w, w, { fit: "cover" }).webp({ quality: w === 800 ? 80 : 74 }).toBuffer();
              await upload(`products/rebrand/${hash}-${w}.webp`, webp);
            }
            mapped.add(hash);
            saved++;
          }
        }
      }
      await saveHashes(mapped);
      await appendFile(LOG, JSON.stringify({ key, ok: true, saved, unmatched: unmatched.length }) + "\n");
      console.log(`  ✓ ${i + 1}/${todo.length} ${g.productSlug} ${g.placement}${g.person ? " (model)" : ""} → ${saved} photos ${((Date.now() - started) / 1000).toFixed(0)}s`);
    } catch (err) {
      const error = String((err as Error).message).slice(0, 300);
      await appendFile(LOG, JSON.stringify({ key, ok: false, error }) + "\n");
      console.log(`  ✗ ${i + 1}/${todo.length} ${g.productSlug} ${g.placement}: ${error}`);
    }
    const spent = Date.now() - started;
    if (spent < TASK_INTERVAL_MS && i < todo.length - 1) await new Promise((r) => setTimeout(r, TASK_INTERVAL_MS - spent));
  }
}

async function plan() {
  const { groups, toOpenAI } = await buildPlan();
  const photos = groups.reduce((n, g) => n + Object.values(g.colors).flat().length, 0);
  console.log(`Printful: ${photos} photos in ${groups.length} tasks across ${new Set(groups.map((g) => g.productId)).size} products`);
  console.log(`OpenAI:   ${toOpenAI.length} photos`);
  const why = new Map<string, number>();
  for (const t of toOpenAI) why.set(t.why, (why.get(t.why) ?? 0) + 1);
  for (const [w, c] of [...why.entries()].sort((a, b) => b[1] - a[1])) console.log(`            ${c}\t${w}`);
  await writeFile(PLAN_FILE, JSON.stringify({ groups, toOpenAI }, null, 1));
  console.log(`\nwritten to ${PLAN_FILE}`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const [cmd = "plan"] = process.argv.slice(2);
  const li = process.argv.indexOf("--limit");
  if (cmd === "plan") await plan();
  else if (cmd === "run") await run(li > 0 ? Number(process.argv[li + 1]) : undefined);
  else throw new Error(`unknown command ${cmd}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
