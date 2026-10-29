"use client";

import { SafeImage } from "@/components/shared/SafeImage/SafeImage";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";

interface CartToastProps {
  name: string;
  imageUrl?: string | null;
  quantity: number;
}

export function CartToast({ name, imageUrl, quantity }: CartToastProps) {
  return (
    <motion.div
      className="flex w-[340px] items-center gap-4 border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-3 pr-4 shadow-[var(--shadow-lg)]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative h-16 w-[52px] shrink-0 overflow-hidden bg-[color:var(--color-image-bg)]">
        {imageUrl && (
          <SafeImage compactFallback src={imageUrl} alt="" fill sizes="52px" className="object-contain p-1 mix-blend-multiply dark:mix-blend-normal" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="inline-flex items-center gap-1.5 text-[12px] text-[color:var(--color-text-secondary)]">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-sun)]" />
          Added to your bag{quantity > 1 ? ` · ${quantity}` : ""}
        </span>
        <span className="truncate text-[14px] text-[color:var(--color-text)]">{name}</span>
        <Link href="/cart" className="mt-1 w-fit text-[13px] underline underline-offset-4">
          View bag
        </Link>
      </div>
    </motion.div>
  );
}
