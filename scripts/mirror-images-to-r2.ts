/**
 * Copies every product/banner/category photo referenced in the database into
 * the R2 bucket, keyed by its original path (wp-content/uploads/…), so the
 * site's /media route can serve it. The database is only read, never changed.
 *
 * Sources (pick one):
 *   --from-dir <path>   a local copy of the WordPress files; the folder that
 *                       contains "wp-content" (e.g. an unzipped hosting backup)
 *   --from-url <base>   download from a live origin, default https://images.ravora.co.uk
 *
 * Options:
 *   --dry-run           report what would be copied without uploading
 *   --concurrency <n>   parallel transfers (default 12)
 *
 *   npx tsx scripts/mirror-images-to-r2.ts --from-dir ~/Downloads/backup/public_html
 */
import "dotenv/config";
import { readFile, stat } from "node:fs/promises";
import { join, extname, resolve } from "node:path";
import { homedir } from "node:os";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { legacyKeyFor } from "../src/lib/media";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const dryRun = args.includes("--dry-run");
const concurrency = Number(flag("--concurrency") || 12);
const fromDirArg = flag("--from-dir");
const fromDir = fromDirArg ? resolve(fromDirArg.replace(/^~/, homedir())) : undefined;
const fromUrl = (flag("--from-url") || "https://images.ravora.co.uk").replace(/\/+$/, "");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

const bucket = process.env.R2_BUCKET_NAME!;
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function existingKeys(prefix: string): Promise<Set<string>> {
  const keys = new Set<string>();
  let token: string | undefined;
  do {
    const page = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }));
    page.Contents?.forEach((o) => o.Key && keys.add(o.Key));
    token = page.NextContinuationToken;
  } while (token);
  return keys;
}

async function load(key: string): Promise<Buffer> {
  if (fromDir) {
    const file = join(fromDir, key);
    await stat(file);
    return readFile(file);
  }
  const res = await fetch(`${fromUrl}/${key.split("/").map(encodeURIComponent).join("/")}`, { redirect: "manual" });
  const type = res.headers.get("content-type") || "";
  if (res.status !== 200 || !type.startsWith("image/")) {
    throw new Error(`HTTP ${res.status} ${type || "no content-type"}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  if (!bucket || !process.env.R2_ACCOUNT_ID) throw new Error("R2_* variables are not set");
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL! }),
  });

  const [images, banners, categories] = await Promise.all([
    prisma.productImage.findMany({ select: { url: true } }),
    prisma.banner.findMany({ select: { imageUrl: true } }),
    prisma.category.findMany({ select: { imageUrl: true } }),
  ]);
  await prisma.$disconnect();

  const urls = [
    ...images.map((i) => i.url),
    ...banners.map((b) => b.imageUrl),
    ...categories.map((c) => c.imageUrl),
  ].filter((u): u is string => !!u);
  const keys = [...new Set(urls.map(legacyKeyFor).filter((k): k is string => !!k))];

  const already = await existingKeys("wp-content/");
  const todo = keys.filter((k) => !already.has(k));
  console.log(
    `Referenced photos: ${keys.length} · already in R2: ${keys.length - todo.length} · to copy: ${todo.length}` +
      ` · source: ${fromDir ?? fromUrl}${dryRun ? " · DRY RUN" : ""}`,
  );
  if (dryRun || todo.length === 0) return;

  let done = 0;
  const failed: { key: string; reason: string }[] = [];
  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const key = todo[next++];
      try {
        const body = await load(key);
        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: CONTENT_TYPES[extname(key).toLowerCase()] || "application/octet-stream",
            CacheControl: "public, max-age=31536000, immutable",
          }),
        );
      } catch (e) {
        failed.push({ key, reason: (e as Error).message });
      }
      done++;
      if (done % 250 === 0 || done === todo.length) {
        console.log(`  ${done}/${todo.length} processed, ${failed.length} failed`);
      }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));

  console.log(`Copied ${todo.length - failed.length}, failed ${failed.length}.`);
  if (failed.length) {
    console.log("First failures:");
    failed.slice(0, 10).forEach((f) => console.log(`  ${f.key} — ${f.reason}`));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
