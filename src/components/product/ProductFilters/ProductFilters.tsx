"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
  children?: Category[];
}

interface ProductFiltersProps {
  categories: Category[];
  selectedCategory: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  onSale: boolean;
  brands: string[];
  selectedBrand: string;
  onCategoryChange: (slug: string) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onInStockChange: (value: boolean) => void;
  onSaleChange: (value: boolean) => void;
  onBrandChange: (value: string) => void;
}

function FilterSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[color:var(--color-border)]">
      <button
        className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent py-4 text-[color:var(--color-text)]"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <h3 className="text-[14px] font-medium">{title}</h3>
        {open ? <ChevronUp size={16} strokeWidth={1.5} /> : <ChevronDown size={16} strokeWidth={1.5} />}
      </button>
      {open && <div className="pb-5">{children}</div>}
    </div>
  );
}

function CategoryItem({
  cat,
  depth,
  selectedCategory,
  onCategoryChange,
}: {
  cat: Category;
  depth: number;
  selectedCategory: string;
  onCategoryChange: (slug: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = cat.children && cat.children.length > 0;
  const isActive = selectedCategory === cat.slug;
  const count = cat._count?.products || 0;

  return (
    <>
      <li
        className={`flex cursor-pointer items-center py-1.5 text-[14px] transition-colors ${
          isActive
            ? "font-medium text-[color:var(--color-text)] underline underline-offset-4"
            : "text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text)]"
        }`}
        style={{ paddingLeft: `${depth * 0.875}rem` }}
      >
        <span
          onClick={() => onCategoryChange(cat.slug)}
          className="flex-1 cursor-pointer"
        >
          {cat.name}
          {count > 0 && (
            <span className="ml-1 text-xs text-[color:var(--color-text-tertiary)]">
              ({count})
            </span>
          )}
        </span>
        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="flex cursor-pointer border-none bg-transparent p-0.5 text-[color:var(--color-text-tertiary)]"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </li>
      {hasChildren && expanded && cat.children!.map((child) => (
        <CategoryItem
          key={child.id}
          cat={child}
          depth={depth + 1}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
        />
      ))}
    </>
  );
}

const PRICE_INPUT =
  "w-full border-b border-[color:var(--color-border-strong)] bg-transparent px-0 py-2 text-[14px] text-[color:var(--color-text)] transition-colors focus:border-[color:var(--color-text)] focus:outline-none";

function PriceSection({
  title, minPrice, maxPrice, onMinPriceChange, onMaxPriceChange,
}: {
  title: string;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (v: string) => void;
  onMaxPriceChange: (v: string) => void;
}) {
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);
  const minTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setLocalMin(minPrice); }, [minPrice]);
  useEffect(() => { setLocalMax(maxPrice); }, [maxPrice]);

  const debouncedMin = (v: string) => {
    setLocalMin(v);
    if (minTimer.current) clearTimeout(minTimer.current);
    minTimer.current = setTimeout(() => onMinPriceChange(v), 400);
  };
  const debouncedMax = (v: string) => {
    setLocalMax(v);
    if (maxTimer.current) clearTimeout(maxTimer.current);
    maxTimer.current = setTimeout(() => onMaxPriceChange(v), 400);
  };

  const applyPreset = (min: string, max: string) => {
    setLocalMin(min);
    setLocalMax(max);
    onMinPriceChange(min);
    onMaxPriceChange(max);
  };

  return (
    <FilterSection title={title}>
      <div className="mb-3 flex items-center gap-2">
        <input
          type="number"
          placeholder="Min"
          value={localMin}
          onChange={(e) => debouncedMin(e.target.value)}
          className={PRICE_INPUT}
          min="0"
        />
        <span className="shrink-0 text-[color:var(--color-text-tertiary)]">–</span>
        <input
          type="number"
          placeholder="Max"
          value={localMax}
          onChange={(e) => debouncedMax(e.target.value)}
          className={PRICE_INPUT}
          min="0"
        />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          className="cursor-pointer rounded-full border border-[color:var(--color-border)] bg-transparent px-2 py-1.5 text-[12px] text-[color:var(--color-text-secondary)] transition-colors hover:border-[color:var(--color-text)] hover:text-[color:var(--color-text)]"
          onClick={() => applyPreset("", "25")}
        >
          Under £25
        </button>
        <button
          className="cursor-pointer rounded-full border border-[color:var(--color-border)] bg-transparent px-2 py-1.5 text-[12px] text-[color:var(--color-text-secondary)] transition-colors hover:border-[color:var(--color-text)] hover:text-[color:var(--color-text)]"
          onClick={() => applyPreset("25", "50")}
        >
          £25–£50
        </button>
        <button
          className="cursor-pointer rounded-full border border-[color:var(--color-border)] bg-transparent px-2 py-1.5 text-[12px] text-[color:var(--color-text-secondary)] transition-colors hover:border-[color:var(--color-text)] hover:text-[color:var(--color-text)]"
          onClick={() => applyPreset("50", "100")}
        >
          £50–£100
        </button>
        <button
          className="cursor-pointer rounded-full border border-[color:var(--color-border)] bg-transparent px-2 py-1.5 text-[12px] text-[color:var(--color-text-secondary)] transition-colors hover:border-[color:var(--color-text)] hover:text-[color:var(--color-text)]"
          onClick={() => applyPreset("100", "")}
        >
          £100+
        </button>
      </div>
    </FilterSection>
  );
}

export function ProductFilters({
  categories,
  selectedCategory,
  minPrice,
  maxPrice,
  inStock,
  onSale,
  brands,
  selectedBrand,
  onCategoryChange,
  onMinPriceChange,
  onMaxPriceChange,
  onInStockChange,
  onSaleChange,
  onBrandChange,
}: ProductFiltersProps) {
  const t = useTranslations("product");
  const nav = useTranslations("nav");

  return (
    <aside className="flex flex-col border-t border-[color:var(--color-border)]">
      <FilterSection title={t("filterBy")}>
        {categories.length === 0 ? (
          <div className="flex flex-col">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 py-2">
                <div
                  className="h-3 flex-1 animate-pulse rounded bg-[color:var(--color-bg-tertiary)]"
                  style={{ width: `${50 + (i * 19) % 40}%` }}
                />
                <div className="h-3 w-5 animate-pulse rounded bg-[color:var(--color-bg-tertiary)]" />
              </div>
            ))}
          </div>
        ) : (
          <ul className="m-0 flex max-h-72 list-none flex-col gap-0.5 overflow-y-auto p-0">
            <li
              className={`cursor-pointer py-1.5 text-[14px] transition-colors ${
                !selectedCategory
                  ? "font-medium text-[color:var(--color-text)] underline underline-offset-4"
                  : "text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text)]"
              }`}
              onClick={() => onCategoryChange("")}
            >
              {nav("allCategories")}
            </li>
            {categories.map((cat) => (
              <CategoryItem
                key={cat.id}
                cat={cat}
                depth={0}
                selectedCategory={selectedCategory}
                onCategoryChange={onCategoryChange}
              />
            ))}
          </ul>
        )}
      </FilterSection>

      <PriceSection
        title={t("priceRange")}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onMinPriceChange={onMinPriceChange}
        onMaxPriceChange={onMaxPriceChange}
      />

      {brands.length > 0 && (
        <FilterSection title="Brand" defaultOpen={false}>
          <ul className="m-0 flex max-h-72 list-none flex-col gap-0.5 overflow-y-auto p-0">
            <li
              className={`cursor-pointer py-1.5 text-[14px] transition-colors ${
                !selectedBrand
                  ? "font-medium text-[color:var(--color-text)] underline underline-offset-4"
                  : "text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text)]"
              }`}
              onClick={() => onBrandChange("")}
            >
              All Brands
            </li>
            {brands.map((brand) => (
              <li
                key={brand}
                className={`cursor-pointer py-1.5 text-[14px] transition-colors ${
                  selectedBrand === brand
                    ? "font-medium text-[color:var(--color-text)] underline underline-offset-4"
                    : "text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text)]"
                }`}
                onClick={() => onBrandChange(brand)}
              >
                {brand}
              </li>
            ))}
          </ul>
        </FilterSection>
      )}

      <FilterSection title={t("availability")} defaultOpen={false}>
        <label className="flex cursor-pointer items-center gap-2.5 py-1.5 text-[14px] text-[color:var(--color-text-secondary)]">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => onInStockChange(e.target.checked)}
            className="h-4 w-4 accent-[color:var(--color-primary)]"
          />
          <span>{t("inStock")}</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 py-1.5 text-[14px] text-[color:var(--color-text-secondary)]">
          <input
            type="checkbox"
            checked={onSale}
            onChange={(e) => onSaleChange(e.target.checked)}
            className="h-4 w-4 accent-[color:var(--color-primary)]"
          />
          <span>On Sale</span>
        </label>
      </FilterSection>
    </aside>
  );
}
