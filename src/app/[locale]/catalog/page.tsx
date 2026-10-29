"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, X, Search } from "lucide-react";
import { ProductGrid } from "@/components/product/ProductGrid/ProductGrid";
import { ProductFilters } from "@/components/product/ProductFilters/ProductFilters";
import { ProductSort } from "@/components/product/ProductSort/ProductSort";
import { ProductSkeleton } from "@/components/product/ProductSkeleton/ProductSkeleton";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";

export default function CatalogPage() {
  const t = useTranslations("product");
  const nav = useTranslations("nav");
  const searchParams = useSearchParams();
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [products, setProducts] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const page = parseInt(searchParams.get("page") || "1");
  const sort = searchParams.get("sort") || "newest";
  const category = searchParams.get("category") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const inStock = searchParams.get("inStock") === "true";
  const onSale = searchParams.get("onSale") === "true";
  const selectedBrand = searchParams.get("brand") || "";
  const search = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => { setSearchInput(search); }, [search]);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      if (!("page" in updates)) params.set("page", "1");
      router.push(`?${params.toString()}`);
    },
    [searchParams, router]
  );

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      updateParams({ search: value, page: "1" });
    }, 350);
  };

  const clearAll = () => {
    setSearchInput("");
    router.push("?");
  };

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(console.error);
    fetch("/api/products/brands")
      .then((res) => res.json())
      .then((data) => setBrands(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("sort", sort);
    if (category) params.set("category", category);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (inStock) params.set("inStock", "true");
    if (onSale) params.set("onSale", "true");
    if (selectedBrand) params.set("brand", selectedBrand);
    if (search) params.set("search", search);

    fetch(`/api/products?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, sort, category, minPrice, maxPrice, inStock, onSale, selectedBrand, search]);

  useEffect(() => {
    if (mobileFiltersOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileFiltersOpen]);

  const activeFilterCount = [category, minPrice, maxPrice, inStock, onSale, selectedBrand, search].filter(Boolean).length;

  const view = (() => {
    if (search) return { title: `Search: "${search}"`, subtitle: t("showing", { count: products.length, total }) };
    if (onSale) return { title: "Sale", subtitle: "Discounted products across the catalog" };
    if (sort === "popular") return { title: "Best Sellers", subtitle: "Most ordered products" };
    if (selectedBrand) return { title: selectedBrand, subtitle: `Products by ${selectedBrand}` };
    if (searchParams.has("sort") && sort === "newest") return { title: "New Arrivals", subtitle: "Just landed in store" };
    return { title: nav("catalog"), subtitle: t("showing", { count: products.length, total }) };
  })();

  return (
    <div className="hw-container pb-24">
      <Breadcrumbs
        items={[
          { label: nav("home"), href: "/" },
          ...(view.title !== nav("catalog")
            ? [{ label: "Shop", href: "/catalog" }, { label: view.title }]
            : [{ label: "Shop" }]),
        ]}
      />

      <header className="flex flex-col gap-3 pb-8 pt-4">
        <h1 className="font-serif text-[48px] leading-[0.98] sm:text-[64px]">
          {view.title === nav("catalog") ? "Shop all" : view.title}
        </h1>
        <p className="text-[15px] text-[color:var(--color-text-secondary)]">{view.subtitle}</p>
      </header>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-y border-[color:var(--color-border)] py-3">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex h-9 items-center gap-2 text-[14px] font-medium lg:hidden"
            type="button"
          >
            <SlidersHorizontal size={16} strokeWidth={1.5} />
            Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--color-sun)] px-1 text-[11px] font-semibold text-[#111111]">
                {activeFilterCount}
              </span>
            )}
          </button>
          <div className="relative min-w-0 max-w-xs flex-1">
            <Search size={15} strokeWidth={1.5} className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[color:var(--color-text-tertiary)]" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              className="h-9 w-full bg-transparent pl-6 text-[14px] text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-tertiary)] focus:outline-none"
            />
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAll}
              type="button"
              className="inline-flex shrink-0 items-center gap-1 text-[13px] text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text)]"
            >
              <X size={14} /> Clear all
            </button>
          )}
        </div>
        <ProductSort value={sort} onChange={(v) => updateParams({ sort: v, page: "1" })} />
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr] xl:gap-14">
        <aside className="hidden self-start lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:block">
          <ProductFilters
            categories={categories}
            selectedCategory={category}
            minPrice={minPrice}
            maxPrice={maxPrice}
            inStock={inStock}
            onSale={onSale}
            brands={brands}
            selectedBrand={selectedBrand}
            onCategoryChange={(v) => updateParams({ category: v, page: "1" })}
            onMinPriceChange={(v) => updateParams({ minPrice: v, page: "1" })}
            onMaxPriceChange={(v) => updateParams({ maxPrice: v, page: "1" })}
            onInStockChange={(v) => updateParams({ inStock: v ? "true" : "", page: "1" })}
            onSaleChange={(v) => updateParams({ onSale: v ? "true" : "", page: "1" })}
            onBrandChange={(v) => updateParams({ brand: v, page: "1" })}
          />
        </aside>

        <div className="min-w-0">
          {loading ? (
            <ProductSkeleton count={12} />
          ) : products.length === 0 ? (
            <EmptyState
              title={t("filterBy")}
              subtitle={t("priceRange")}
              actionLabel={nav("home")}
              actionHref="/"
            />
          ) : (
            <>
              <ProductGrid products={products} />
              {totalPages > 1 && (
                <div className="mt-16 flex flex-wrap items-center justify-center gap-1.5">
                  <button
                    onClick={() => updateParams({ page: String(page - 1) })}
                    disabled={page <= 1}
                    className={`inline-flex h-9 items-center justify-center px-3 text-[14px] text-[color:var(--color-text)] hover:underline hover:underline-offset-4 ${page <= 1 ? "cursor-not-allowed opacity-40" : ""}`}
                  >
                    Prev
                  </button>
                  {(() => {
                    const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [];
                    if (totalPages <= 7) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      if (page > 3) pages.push("ellipsis-start");
                      const start = Math.max(2, page - 1);
                      const end = Math.min(totalPages - 1, page + 1);
                      for (let i = start; i <= end; i++) pages.push(i);
                      if (page < totalPages - 2) pages.push("ellipsis-end");
                      pages.push(totalPages);
                    }
                    return pages.map((p) =>
                      typeof p === "string" ? (
                        <span key={p} className="flex h-9 w-9 items-center justify-center text-[13px] text-[color:var(--color-text-secondary)]">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => updateParams({ page: String(p) })}
                          aria-current={p === page ? "page" : undefined}
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-[14px] tabular-nums ${
                            p === page
                              ? "bg-[color:var(--color-primary)] text-[color:var(--color-primary-fg)]"
                              : "text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-secondary)]"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    );
                  })()}
                  <button
                    onClick={() => updateParams({ page: String(page + 1) })}
                    disabled={page >= totalPages}
                    className={`inline-flex h-9 items-center justify-center px-3 text-[14px] text-[color:var(--color-text)] hover:underline hover:underline-offset-4 ${page >= totalPages ? "cursor-not-allowed opacity-40" : ""}`}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filters overlay */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[200]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col overflow-auto bg-[color:var(--color-bg)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-serif text-[28px] text-[color:var(--color-text)]">Filters</span>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="flex h-9 w-9 items-center justify-center text-[color:var(--color-text)]"
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>
            <ProductFilters
              categories={categories}
              selectedCategory={category}
              minPrice={minPrice}
              maxPrice={maxPrice}
              inStock={inStock}
              onSale={onSale}
              brands={brands}
              selectedBrand={selectedBrand}
              onCategoryChange={(v) => { updateParams({ category: v, page: "1" }); setMobileFiltersOpen(false); }}
              onMinPriceChange={(v) => updateParams({ minPrice: v, page: "1" })}
              onMaxPriceChange={(v) => updateParams({ maxPrice: v, page: "1" })}
              onInStockChange={(v) => updateParams({ inStock: v ? "true" : "", page: "1" })}
              onSaleChange={(v) => updateParams({ onSale: v ? "true" : "", page: "1" })}
              onBrandChange={(v) => { updateParams({ brand: v, page: "1" }); setMobileFiltersOpen(false); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
