/**
 * Replace the old "RAVORA best. ever." print on product photos with the Hafwear
 * logo, using OpenAI. Resumable — every step is recorded under tmp/rebrand/.
 *
 *   npx tsx scripts/rebrand-photos.ts scan            # find photos with the old print
 *   npx tsx scripts/rebrand-photos.ts edit [--limit N] # regenerate + upload them
 *   npx tsx scripts/rebrand-photos.ts all             # both
 *
 * scan:  every distinct catalogue photo (img.ravora.co.uk/<hash>-800.webp) is
 *        shown at 400px to a small vision model: does it show RAVORA, and is the
 *        garment worn by a person?
 * edit:  photos with RAVORA are regenerated —
 *          · on a person: only the print is swapped, everything else stays;
 *          · product shots: just the garment on a plain studio background, props
 *            (shoes, toys, dominoes…) removed, print swapped.
 *        Results go to OUR R2 bucket as products/rebrand/<hash>-{800,400}.webp and
 *        the hash is added to src/data/rebranded-images.json, which
 *        resolveImageUrl() uses to serve them. The shared DB and the old CDN
 *        (read by the other store) are never touched.
 *
 * Env: OPENAI_API_KEY, R2_* (from .env / .env.local).
 */
// Must be the first import: src/lib/prisma reads DATABASE_URL (from .env) at import time.
import "dotenv/config";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../src/lib/prisma";

const OUT = path.resolve("tmp/rebrand");
const SCAN_LOG = path.join(OUT, "scan.jsonl");
const EDIT_LOG = path.join(OUT, "edit.jsonl");
const LOGO = path.join(OUT, "logo.png");
const MAP_FILE = path.resolve("src/data/rebranded-images.json");
const CDN = "https://img.ravora.co.uk/ravora/img";

const SCAN_MODEL = process.env.REBRAND_SCAN_MODEL || "gpt-5.4-mini";
const EDIT_MODEL = process.env.REBRAND_EDIT_MODEL || "gpt-image-2";
const EDIT_QUALITY = process.env.REBRAND_EDIT_QUALITY || "medium";
const SCAN_CONCURRENCY = Number(process.env.REBRAND_SCAN_CONCURRENCY || 24);
const EDIT_CONCURRENCY = Number(process.env.REBRAND_EDIT_CONCURRENCY || 6);

const LOGO_DESC = `the logo from the second image: a golden half-sun above a short horizontal line, followed by the lowercase wordmark "hafwear". Spell it exactly "hafwear", all lowercase. Keep the sun golden (#E0A526); make the line and wordmark dark charcoal on light fabric or off-white on dark fabric so it reads clearly`;
const OLD_PRINT = `the old chest/garment print that reads "RAVORA" (often with "best. ever." underneath and a pointing-hand cursor icon)`;

const PROMPT_PERSON = `Edit the first image. Replace ${OLD_PRINT} with ${LOGO_DESC}. Place it where the old print was, at about the same size, following the fabric's folds, perspective and lighting so it looks printed on the garment. Remove every trace of "RAVORA", "best. ever." and the cursor icon. Change nothing else at all: same person, face, pose, garment, background, framing and lighting.`;

const PROMPT_PRODUCT = `Edit the first image into a clean e-commerce product photo. Keep ONLY the garment(s) — remove every other object (shoes, toys, dominoes, plants, props, hangers, hands) and replace the background with a plain, seamless light-grey studio background with a soft natural shadow. Keep the garment exactly as it is: same type, colour, cut, folds, angle, labels and position in the frame. Replace ${OLD_PRINT} with ${LOGO_DESC}, in the same place and at about the same size, following the fabric so it looks printed. Remove every trace of "RAVORA", "best. ever." and the cursor icon. Do not add anything new.`;

type ScanRow = { hash: string; ravora: boolean; person: boolean; error?: string };
type EditRow = { hash: string; ok: boolean; person?: boolean; error?: string };

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

async function readJsonl<T>(file: string): Promise<T[]> {
  if (!existsSync(file)) return [];
  return (await readFile(file, "utf8")).split("\n").filter(Boolean).map((l) => JSON.parse(l) as T);
}

async function pool<T>(items: T[], n: number, fn: (item: T, i: number) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        await fn(items[i], i);
      }
    }),
  );
}

async function withRetry<T>(fn: () => Promise<T>, tries = 5): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = String((err as Error).message);
      const retryable = /429|5\d\d|rate|timeout|ECONNRESET|fetch failed/i.test(msg);
      if (!retryable || attempt >= tries) throw err;
      await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt + Math.random() * 1000));
    }
  }
}

async function download(url: string): Promise<Buffer> {
  return withRetry(async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  });
}

async function openai(pathname: string, init: RequestInit) {
  const res = await fetch(`https://api.openai.com/v1/${pathname}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, ...(init.headers || {}) },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${json?.error?.message ?? "error"}`);
  return json;
}

/** All distinct catalogue photo hashes, in catalogue order. */
async function catalogueHashes(): Promise<string[]> {
  const rows = await prisma.productImage.findMany({ select: { url: true }, orderBy: [{ productId: "asc" }, { sortOrder: "asc" }] });
  const seen = new Set<string>();
  for (const { url } of rows) {
    const h = url.match(/img\.ravora\.co\.uk\/ravora\/img\/([0-9a-f]{20})-\d+\.webp/)?.[1];
    if (h) seen.add(h);
  }
  return [...seen];
}

async function scan() {
  const hashes = await catalogueHashes();
  const done = new Set((await readJsonl<ScanRow>(SCAN_LOG)).filter((r) => !r.error).map((r) => r.hash));
  const todo = hashes.filter((h) => !done.has(h));
  console.log(`scan: ${hashes.length} photos, ${done.size} already scanned, ${todo.length} to go`);
  let n = 0;
  let hits = 0;

  await pool(todo, SCAN_CONCURRENCY, async (hash) => {
    let row: ScanRow;
    try {
      const img = await download(`${CDN}/${hash}-400.webp`);
      const jpg = await sharp(img).jpeg({ quality: 80 }).toBuffer();
      const json = await withRetry(() =>
        openai("chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: SCAN_MODEL,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: 'Product photo check. Answer JSON {"ravora": bool, "person": bool}. ravora = the word "RAVORA" (any case) or a "best. ever." print with a pointing-hand cursor is visible anywhere on the garment or image. person = the garment is worn by a person (any visible body part wearing it).',
                  },
                  { type: "image_url", image_url: { url: `data:image/jpeg;base64,${jpg.toString("base64")}`, detail: "low" } },
                ],
              },
            ],
          }),
        }),
      );
      const ans = JSON.parse(json.choices[0].message.content);
      row = { hash, ravora: !!ans.ravora, person: !!ans.person };
    } catch (err) {
      row = { hash, ravora: false, person: false, error: String((err as Error).message).slice(0, 200) };
    }
    if (row.ravora) hits++;
    await appendFile(SCAN_LOG, JSON.stringify(row) + "\n");
    if (++n % 250 === 0) console.log(`  scanned ${n}/${todo.length} (+${hits} with RAVORA)`);
  });
  const all = await readJsonl<ScanRow>(SCAN_LOG);
  console.log(`scan done: ${all.filter((r) => r.ravora).length} photos with RAVORA, ${all.filter((r) => r.error).length} errors`);
}

async function upload(key: string, body: Buffer) {
  await withRetry(() =>
    s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    ),
  );
}

async function saveMap(hashes: Set<string>) {
  await writeFile(MAP_FILE, JSON.stringify([...hashes].sort()) + "\n");
}

async function edit(limit?: number) {
  const scanRows = new Map((await readJsonl<ScanRow>(SCAN_LOG)).map((r) => [r.hash, r]));
  const doneRows = await readJsonl<EditRow>(EDIT_LOG);
  const done = new Set(doneRows.filter((r) => r.ok).map((r) => r.hash));
  const mapped = new Set<string>(existsSync(MAP_FILE) ? JSON.parse(await readFile(MAP_FILE, "utf8")) : []);
  let todo = [...scanRows.values()].filter((r) => r.ravora && !done.has(r.hash));
  const only = process.env.REBRAND_ONLY?.split(",");
  if (only) todo = todo.filter((r) => only.includes(r.hash));
  if (limit) todo = todo.slice(0, limit);
  console.log(`edit: ${todo.length} photos to regenerate (${done.size} done before)`);
  const logo = await readFile(LOGO);
  await mkdir(path.join(OUT, "after"), { recursive: true });
  let n = 0;

  await pool(todo, EDIT_CONCURRENCY, async ({ hash, person }) => {
    const t = Date.now();
    try {
      const src = await download(`${CDN}/${hash}-800.webp`);
      const png = await sharp(src).png().toBuffer();
      const form = new FormData();
      form.append("model", EDIT_MODEL);
      form.append("prompt", person ? PROMPT_PERSON : PROMPT_PRODUCT);
      form.append("image[]", new Blob([new Uint8Array(png)], { type: "image/png" }), `${hash}.png`);
      form.append("image[]", new Blob([new Uint8Array(logo)], { type: "image/png" }), "logo.png");
      form.append("size", "1024x1024");
      form.append("quality", EDIT_QUALITY);
      const json = await withRetry(() => openai("images/edits", { method: "POST", body: form }));
      const out = Buffer.from(json.data[0].b64_json, "base64");
      await writeFile(path.join(OUT, "after", `${hash}.png`), out);

      const meta = await sharp(src).metadata();
      for (const w of [800, 400] as const) {
        const h = meta.width && meta.height ? Math.round((w * meta.height) / meta.width) : w;
        const webp = await sharp(out).resize(w, h, { fit: "cover" }).webp({ quality: w === 800 ? 80 : 74 }).toBuffer();
        await upload(`products/rebrand/${hash}-${w}.webp`, webp);
      }
      mapped.add(hash);
      await saveMap(mapped);
      await appendFile(EDIT_LOG, JSON.stringify({ hash, ok: true, person } satisfies EditRow) + "\n");
      console.log(`  ✓ ${++n}/${todo.length} ${hash} ${person ? "person" : "product"} ${((Date.now() - t) / 1000).toFixed(0)}s`);
    } catch (err) {
      const error = String((err as Error).message).slice(0, 300);
      await appendFile(EDIT_LOG, JSON.stringify({ hash, ok: false, person, error } satisfies EditRow) + "\n");
      console.log(`  ✗ ${++n}/${todo.length} ${hash}: ${error}`);
    }
  });
}

async function main() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");
  await mkdir(OUT, { recursive: true });
  const [cmd = "all"] = process.argv.slice(2);
  const limitArg = process.argv.indexOf("--limit");
  const limit = limitArg > 0 ? Number(process.argv[limitArg + 1]) : undefined;
  if (cmd === "scan" || cmd === "all") await scan();
  if (cmd === "edit" || cmd === "all") await edit(limit);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
