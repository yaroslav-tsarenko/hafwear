import rebrandedImages from "@/data/rebranded-images.json";
import hiddenImages from "@/data/hidden-images.json";

/**
 * Product photos were stored on the old WordPress host (images.ravora.co.uk),
 * which is no longer serving files. The database still holds those URLs, so
 * we rewrite them at render time to our own /media route, which streams the
 * same path from the R2 bucket (see src/app/media/[...path]/route.ts).
 * This needs no custom domain and no database migration.
 */
const LEGACY_HOSTS = [
  "https://images.ravora.co.uk/",
  "https://ravora.co.uk/",
  "https://www.ravora.co.uk/",
];

export const MEDIA_PREFIX = "/media/";

/**
 * Catalogue photos (img.ravora.co.uk/ravora/img/<hash>-<w>.webp) that showed the
 * old "RAVORA" print were regenerated with the Hafwear logo and saved to our R2
 * as products/rebrand/<hash>-<w>.webp (scripts/rebrand-photos.ts). The shared DB
 * and old CDN still serve the originals to the other store; we swap on render.
 */
const REBRANDED = new Set<string>(rebrandedImages as string[]);
const CATALOGUE_PHOTO = /^https:\/\/img\.ravora\.co\.uk\/ravora\/img\/([0-9a-f]{20})-(\d+)\.webp$/;

/**
 * Photos still showing the old print that we cannot regenerate: their art covers
 * the whole garment and the original file is gone. Hidden rather than shown —
 * a missing photo costs less than the previous brand's name on our storefront.
 * Regenerate one and it moves to rebranded-images.json, out of this list.
 */
const HIDDEN = new Set<string>(hiddenImages as string[]);

export function isHiddenImage(url: string | null | undefined): boolean {
  const photo = url?.match(CATALOGUE_PHOTO);
  return !!photo && HIDDEN.has(photo[1]);
}

/** Drop the photos above from a gallery, so the next clean one leads instead. */
export function visibleImages<T extends { url: string }>(images: T[]): T[] {
  const kept = images.filter((i) => !isHiddenImage(i.url));
  return kept.length ? kept : [];
}

export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const photo = url.match(CATALOGUE_PHOTO);
  if (photo && REBRANDED.has(photo[1])) return `${MEDIA_PREFIX}products/rebrand/${photo[1]}-${photo[2]}.webp`;
  if (photo && HIDDEN.has(photo[1])) return null;
  for (const host of LEGACY_HOSTS) {
    if (url.startsWith(host)) return MEDIA_PREFIX + url.slice(host.length);
  }
  return url;
}

/** R2 object key for a legacy URL, e.g. "wp-content/uploads/2026/04/x.jpg". */
export function legacyKeyFor(url: string): string | null {
  for (const host of LEGACY_HOSTS) {
    if (url.startsWith(host)) return decodeURIComponent(url.slice(host.length).split("?")[0]);
  }
  return null;
}

/** Absolute URL for feeds and structured data, where relative paths aren't allowed. */
export function absoluteImageUrl(url: string | null | undefined, siteUrl: string): string {
  const resolved = resolveImageUrl(url);
  if (!resolved) return "";
  return resolved.startsWith("/") ? `${siteUrl.replace(/\/+$/, "")}${resolved}` : resolved;
}
