import { NextRequest, after } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

// Streams product photos from the R2 bucket under our own origin, so images
// work before a public CDN domain is connected. Paths mirror the old
// WordPress layout, e.g. /media/wp-content/uploads/2026/04/photo.jpg.
//
// A photo not yet copied to R2 is fetched once from the old WordPress host,
// served, and saved to R2 in the background — so the bucket fills itself and
// the site keeps working if that host goes down again.

const LEGACY_ORIGIN = process.env.LEGACY_IMAGE_ORIGIN || "https://images.ravora.co.uk";

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const ALLOWED_PREFIXES = ["wp-content/", "products/", "banners/", "categories/", "thumbnails/"];

export async function GET(_request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const key = path.map(decodeURIComponent).join("/");

  if (key.includes("..") || !ALLOWED_PREFIXES.some((p) => key.startsWith(p))) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const object = await client.send(
      new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }),
    );
    if (!object.Body) return new Response("Not found", { status: 404 });

    return new Response(object.Body.transformToWebStream(), {
      headers: {
        "Content-Type": object.ContentType || "image/jpeg",
        ...(object.ContentLength ? { "Content-Length": String(object.ContentLength) } : {}),
        // Photos never change under the same key — let browsers and Vercel's CDN keep them.
        "Cache-Control": "public, max-age=31536000, immutable",
        ...(object.ETag ? { ETag: object.ETag } : {}),
      },
    });
  } catch (error) {
    const name = (error as { name?: string })?.name;
    if (name === "NoSuchKey" || name === "NotFound") {
      const fallback = key.startsWith("wp-content/") ? await fromLegacyOrigin(key) : null;
      if (fallback) return fallback;
      // Never cache a miss — the photo may be uploaded a minute later.
      return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
    }
    console.error("[media] R2 read failed:", key, error);
    return new Response("Unavailable", { status: 502 });
  }
}

async function fromLegacyOrigin(key: string): Promise<Response | null> {
  try {
    const res = await fetch(`${LEGACY_ORIGIN}/${key.split("/").map(encodeURIComponent).join("/")}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    const type = res.headers.get("content-type") || "";
    if (res.status !== 200 || !type.startsWith("image/")) return null;

    const body = Buffer.from(await res.arrayBuffer());
    after(async () => {
      try {
        await client.send(
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            Body: body,
            ContentType: type,
            CacheControl: "public, max-age=31536000, immutable",
          }),
        );
      } catch (error) {
        console.error("[media] R2 backfill failed:", key, error);
      }
    });

    return new Response(body, {
      headers: {
        "Content-Type": type,
        "Content-Length": String(body.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return null;
  }
}
