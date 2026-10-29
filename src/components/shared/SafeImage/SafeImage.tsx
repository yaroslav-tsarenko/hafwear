"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { resolveImageUrl } from "@/lib/media";
import { HafwearMark } from "@/components/layout/HafwearLogo";

type SafeImageProps = Omit<ImageProps, "src"> & {
  src: string | null | undefined;
  /** Hide the "Photo coming soon" caption on very small thumbnails. */
  compactFallback?: boolean;
};

/**
 * next/image that maps legacy photo URLs to /media and, if a photo can't be
 * loaded, shows a calm on-brand placeholder instead of a broken-image icon.
 * Must be rendered inside a positioned box when using `fill`.
 */
export function SafeImage({ src, alt, compactFallback = false, className, ...rest }: SafeImageProps) {
  const resolved = resolveImageUrl(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!resolved || failedSrc === resolved) {
    return (
      <span
        role="img"
        aria-label={alt || "Photo unavailable"}
        // Keep the caller's classes so hover/opacity behaviour (e.g. the card's second photo) still applies.
        className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[color:var(--color-image-bg)] text-[color:var(--color-text-tertiary)] ${className ?? ""}`}
      >
        <HafwearMark size={compactFallback ? 16 : 28} className="opacity-60" />
        {!compactFallback && <span className="text-[11px] tracking-[0.04em]">Photo coming soon</span>}
      </span>
    );
  }

  return (
    <Image
      {...rest}
      src={resolved}
      alt={alt}
      className={className}
      onError={() => setFailedSrc(resolved)}
    />
  );
}
