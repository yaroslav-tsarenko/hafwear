"use client";

import { useState, useRef, useEffect } from "react";
import { useCurrency, type Currency } from "@/providers/CurrencyProvider";

const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: "GBP", symbol: "£", label: "GBP (£)" },
  { code: "EUR", symbol: "€", label: "EUR (€)" },
];

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = CURRENCIES.find((c) => c.code === currency)!;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Currency"
        aria-expanded={open}
        className="inline-flex h-10 items-center justify-center gap-1 px-2 text-[13px] font-medium text-[color:var(--color-text)] transition-opacity hover:opacity-60"
      >
        <span>{current.symbol}</span>
        <span>{current.code}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 min-w-[128px] overflow-hidden border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => {
                setCurrency(c.code);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                c.code === currency
                  ? "font-semibold text-[color:var(--color-text)] underline underline-offset-4"
                  : "text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-secondary)]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
