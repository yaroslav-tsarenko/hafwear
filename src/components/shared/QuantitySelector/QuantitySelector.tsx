"use client";

import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  quantity: number;
  maxQuantity: number;
  onChange: (quantity: number) => void;
  size?: "sm" | "md";
}

export function QuantitySelector({ quantity, maxQuantity, onChange, size = "md" }: QuantitySelectorProps) {
  const height = size === "sm" ? "h-9" : "h-12";
  const button =
    "inline-flex h-full w-10 items-center justify-center text-[color:var(--color-text)] transition-opacity hover:opacity-60 disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className={`inline-flex ${height} items-center rounded-full border border-[color:var(--color-border-strong)]`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(1, quantity - 1))}
        disabled={quantity <= 1}
        aria-label="Decrease quantity"
        className={button}
      >
        <Minus size={14} strokeWidth={1.5} />
      </button>
      <span className="min-w-6 text-center text-[14px] tabular-nums" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(maxQuantity, quantity + 1))}
        disabled={quantity >= maxQuantity}
        aria-label="Increase quantity"
        className={button}
      >
        <Plus size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}
