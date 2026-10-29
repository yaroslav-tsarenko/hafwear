"use client";

import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

interface ProductSortProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProductSort({ value, onChange }: ProductSortProps) {
  const t = useTranslations("product");

  const options = [
    { key: "newest", label: t("newest") },
    { key: "popular", label: "Most popular" },
    { key: "price-asc", label: t("priceLowHigh") },
    { key: "price-desc", label: t("priceHighLow") },
    { key: "name-asc", label: t("nameAZ") },
  ];

  return (
    <label className="relative inline-flex h-9 items-center gap-1 text-[14px]">
      <span className="text-[color:var(--color-text-secondary)]">{t("sortBy")}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none bg-transparent pr-5 font-medium text-[color:var(--color-text)] focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.key} value={option.key}>{option.label}</option>
        ))}
      </select>
      <ChevronDown size={14} strokeWidth={1.5} className="pointer-events-none absolute right-0" />
    </label>
  );
}
