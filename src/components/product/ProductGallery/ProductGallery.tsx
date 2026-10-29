"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  images: { id: string; url: string; alt?: string | null }[];
  productName: string;
}

/**
 * Desktop: every photo stacked in a two-column grid (first one full width),
 * so the shopper scrolls through the product instead of clicking thumbnails.
 * Mobile: a swipeable strip with a position counter.
 */
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [current, setCurrent] = useState(0);
  const strip = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center bg-[color:var(--color-image-bg)] text-[14px] text-[color:var(--color-text-tertiary)]">
        No image
      </div>
    );
  }

  const onScroll = () => {
    const el = strip.current;
    if (!el) return;
    setCurrent(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <>
      {/* Mobile strip */}
      <div className="relative md:hidden">
        <div
          ref={strip}
          onScroll={onScroll}
          className="scrollbar-none -mx-5 flex snap-x snap-mandatory overflow-x-auto sm:-mx-8"
        >
          {images.map((image, index) => (
            <div key={image.id} className="relative aspect-[4/5] w-full shrink-0 snap-center bg-[color:var(--color-image-bg)]">
              <Image
                src={image.url}
                alt={image.alt || `${productName} — photo ${index + 1}`}
                fill
                sizes="100vw"
                priority={index === 0}
                className="object-contain p-[8%] mix-blend-multiply dark:mix-blend-normal"
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <span className="absolute bottom-3 right-0 bg-[color:var(--color-bg)] px-2 py-1 text-[12px] tabular-nums">
            {current + 1} / {images.length}
          </span>
        )}
      </div>

      {/* Desktop grid */}
      <div className="hidden grid-cols-2 gap-2 md:grid">
        {images.map((image, index) => (
          <div
            key={image.id}
            className={`relative bg-[color:var(--color-image-bg)] ${
              index === 0 || images.length === 2 ? "col-span-2 aspect-[4/5]" : "aspect-[4/5]"
            }`}
          >
            <Image
              src={image.url}
              alt={image.alt || `${productName} — photo ${index + 1}`}
              fill
              sizes={index === 0 ? "(max-width: 1280px) 55vw, 760px" : "(max-width: 1280px) 28vw, 380px"}
              priority={index === 0}
              className="object-contain p-[8%] mix-blend-multiply dark:mix-blend-normal"
            />
          </div>
        ))}
      </div>
    </>
  );
}
