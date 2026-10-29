import { NextRequest } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Streams product photos from the R2 bucket under our own origin, so images
// work before a public CDN domain is connected. Paths mirror the old
// WordPress layout, e.g. /media/wp-content/uploads/2026/04/photo.jpg.

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
      // Short cache so photos appear soon after they're uploaded.
      return new Response("Not found", { status: 404, headers: { "Cache-Control": "public, max-age=300" } });
    }
    console.error("[media] R2 read failed:", key, error);
    return new Response("Unavailable", { status: 502 });
  }
}
