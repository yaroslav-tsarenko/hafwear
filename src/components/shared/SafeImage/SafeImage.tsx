"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { resolveImageUrl } from "@/lib/media";

type SafeImageProps = Omit<ImageProps, "src"> & {
  src: string | null | undefined;
  /** Kept for callers; the fallback tile is the same at every size now. */
  compactFallback?: boolean;
};

/**
 * next/image that maps legacy photo URLs to /media.
 *
 * A photo that fails to load is never announced to the shopper: the image
 * optimiser can hiccup on a perfectly good photo, and a tile reading "photo
 * coming soon" over a product that has photos looks broken. So we retry the
 * same file unoptimised first, and only then fall back to a plain empty tile.
 * Products that genuinely have no photo left are kept out of the storefront
 * altogether (see src/lib/visible-products.ts), so they never reach here.
 *
 * Must be rendered inside a positioned box when using `fill`.
 */
export function SafeImage({ src, alt, compactFallback: _compactFallback = false, className, ...rest }: SafeImageProps) {
  const resolved = resolveImageUrl(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [rawSrc, setRawSrc] = useState<string | null>(null);

  if (!resolved || failedSrc === resolved) {
    return (
      <span
        role="presentation"
        aria-hidden="true"
        // Keep the caller's classes so hover/opacity behaviour (e.g. the card's second photo) still applies.
        className={`absolute inset-0 bg-[color:var(--color-image-bg)] ${className ?? ""}`}
      />
    );
  }

  return (
    <Image
      {...rest}
      key={rawSrc ? "raw" : "optimised"}
      src={resolved}
      alt={alt}
      className={className}
      // One retry straight from storage: most failures are the optimiser, not the file.
      unoptimized={rawSrc === resolved}
      onError={() => (rawSrc === resolved ? setFailedSrc(resolved) : setRawSrc(resolved))}
    />
  );
}
