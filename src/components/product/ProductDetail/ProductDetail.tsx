"use client";

import { useMemo, useState, type ComponentProps } from "react";
import { ProductGallery } from "@/components/product/ProductGallery/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo/ProductInfo";

type GalleryImage = { id: string; url: string; alt?: string | null };

export interface ColorImages {
  /** Variant option the photos follow, e.g. "Color". */
  option: string;
  /** Colour value → R2 photo hashes, the colour's main photo first. */
  images: Record<string, string[]>;
}

type ProductDetailProps = {
  images: GalleryImage[];
  colorImages?: ColorImages | null;
} & Omit<ComponentProps<typeof ProductInfo>, "imageUrl" | "initialSelected" | "onOptionChange">;

const hashOf = (url: string) => url.match(/\/([0-9a-f]{20})-\d+\.webp/)?.[1];

/**
 * Product photos + buy box. Keeps the chosen colour so the gallery shows that
 * colour's photos (and the bag gets the right thumbnail).
 */
export function ProductDetail({ images, colorImages, ...info }: ProductDetailProps) {
  // Colours that really have photos in this product's gallery.
  const byColor = useMemo(() => {
    const map = new Map<string, GalleryImage[]>();
    if (!colorImages) return map;
    const byHash = new Map<string, GalleryImage>();
    for (const img of images) {
      const h = hashOf(img.url);
      if (h) byHash.set(h, img);
    }
    for (const [color, hashes] of Object.entries(colorImages.images)) {
      const list = hashes.map((h) => byHash.get(h)).filter((x): x is GalleryImage => !!x);
      if (list.length) map.set(color, list);
    }
    return map;
  }, [images, colorImages]);

  // Start on the first colour that has stock and photos, so photo and selection agree.
  const initialColor = useMemo(() => {
    if (!colorImages || !byColor.size) return undefined;
    const inStock = (info.variants ?? []).filter((v) => v.quantity > 0).map((v) => v.options?.[colorImages.option]);
    return inStock.find((c) => c && byColor.has(c)) ?? [...byColor.keys()][0];
  }, [colorImages, byColor, info.variants]);

  const [color, setColor] = useState(initialColor);

  const shown = (color && byColor.get(color)) || images;

  return (
    <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-16">
      <ProductGallery key={color ?? "all"} images={shown} productName={info.name} />
      <div className="md:sticky md:top-[calc(var(--header-height)+1.5rem)]">
        <ProductInfo
          {...info}
          imageUrl={shown[0]?.url ?? images[0]?.url}
          initialSelected={colorImages && initialColor ? { [colorImages.option]: initialColor } : undefined}
          onOptionChange={(key, value) => {
            if (colorImages && key === colorImages.option) setColor(value);
          }}
        />
      </div>
    </div>
  );
}
