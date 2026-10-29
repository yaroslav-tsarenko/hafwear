"use client";

import { useState, useEffect, useRef } from "react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Link, usePathname } from "@/i18n/routing";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Menu, X, User as UserIcon, Heart, Shield, ArrowRight, ChevronDown } from "lucide-react";
import { useCart } from "@/providers/CartProvider";
import { useAuth } from "@/providers/AuthProvider";
import { ThemeToggle } from "./ThemeToggle";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { HafwearLogo } from "../HafwearLogo";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
  children?: Category[];
}

interface NavItem {
  label: string;
  href: string;
  /** Root category slug whose subtree fills the mega menu. */
  dept?: string;
}

const NAV: NavItem[] = [
  { label: "Women", href: "/catalog/women", dept: "women" },
  { label: "Men", href: "/catalog/men", dept: "men" },
  { label: "Kids", href: "/catalog/kids", dept: "kids" },
  { label: "Swim", href: "/catalog/women-swimwear" },
  { label: "New in", href: "/catalog?sort=newest" },
  { label: "Sale", href: "/catalog?onSale=true" },
];

const LABEL_OVERRIDES: Record<string, string> = {
  "hoodies & sweatshirts": "Hoodies & sweats",
  "all-over shirts": "All-over prints",
};

function niceLabel(name: string) {
  return LABEL_OVERRIDES[name.toLowerCase()] ?? name;
}

function subtreeCount(cat: Category): number {
  return (cat._count?.products || 0) + (cat.children || []).reduce((s, c) => s + subtreeCount(c), 0);
}

// No display utility here so callers can pick `inline-flex` or `hidden md:inline-flex` without conflicts.
const iconBase =
  "relative h-10 w-10 items-center justify-center text-[color:var(--color-text)] transition-opacity hover:opacity-60";
const iconButton = `inline-flex ${iconBase}`;

export function Header() {
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const { itemCount, cartBounce } = useCart();
  const { user, role } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [openDept, setOpenDept] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close every overlay on navigation (adjusting state during render, not in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpenDept(null);
    setSearchOpen(false);
    setMobileOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenDept(null);
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openMenu = (dept: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setSearchOpen(false);
    setOpenDept(dept);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenDept(null), 120);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/en/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setMobileOpen(false);
  };

  const deptTree = (slug: string) => categories.find((c) => c.slug === slug);
  const activeDept = openDept ? deptTree(openDept) : undefined;
  const activeNav = NAV.find((n) => n.dept === openDept);
  const isAdmin = !!user && (role === "ADMIN" || role === "SUPER_ADMIN");

  return (
    <>
      {/* Announcement */}
      <div className="bg-[color:var(--color-text)] text-[color:var(--color-bg)]">
        <div className="hw-container flex h-9 items-center justify-center gap-3 text-[12px] tracking-[0.01em]">
          <span>Free UK delivery over £100</span>
          <span aria-hidden className="h-1 w-1 rounded-full bg-[color:var(--color-sun)]" />
          <span>14-day returns</span>
          <span aria-hidden className="hidden h-1 w-1 rounded-full bg-[color:var(--color-sun)] sm:inline-block" />
          <span className="hidden sm:inline">From Bridgend, Wales</span>
        </div>
      </div>

      <header
        className={`sticky top-0 z-40 border-b bg-[color:var(--color-bg)] transition-colors ${
          scrolled || openDept || searchOpen ? "border-[color:var(--color-border)]" : "border-transparent"
        }`}
        onMouseLeave={scheduleClose}
      >
        <div className="hw-container grid h-16 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4">
          {/* Left — primary nav (desktop) / menu button (mobile) */}
          <div className="flex items-center">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className={`${iconBase} -ml-2 inline-flex lg:hidden`}
            >
              <Menu size={20} strokeWidth={1.5} />
            </button>
            <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
              {NAV.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onMouseEnter={() => (item.dept ? openMenu(item.dept) : scheduleClose())}
                  onFocus={() => item.dept && openMenu(item.dept)}
                  aria-expanded={item.dept ? openDept === item.dept : undefined}
                  className={`relative py-5 text-[14px] transition-colors ${
                    item.label === "Sale" ? "text-[color:var(--color-sale)]" : "text-[color:var(--color-text)]"
                  } after:absolute after:inset-x-0 after:bottom-[14px] after:h-px after:origin-left after:bg-current after:transition-transform ${
                    openDept === item.dept && item.dept ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center — logo */}
          <Link href="/" aria-label="Hafwear home" className="text-[color:var(--color-text)]">
            <HafwearLogo size={22} />
          </Link>

          {/* Right — actions */}
          <div className="-mr-2 flex items-center justify-end">
            <div className="hidden items-center md:flex">
              <CurrencySwitcher />
              <ThemeToggle />
            </div>
            <button
              onClick={() => { setOpenDept(null); setSearchOpen((v) => !v); }}
              aria-label={t("search")}
              aria-expanded={searchOpen}
              className={iconButton}
            >
              {searchOpen ? <X size={19} strokeWidth={1.5} /> : <Search size={19} strokeWidth={1.5} />}
            </button>
            {user && (
              <Link href="/account/wishlist" aria-label="Wishlist" className={`${iconBase} hidden md:inline-flex`}>
                <Heart size={19} strokeWidth={1.5} />
              </Link>
            )}
            <Link
              href={user ? "/account" : "/auth/login"}
              aria-label={user ? t("account") : t("login")}
              className={`${iconBase} hidden md:inline-flex`}
            >
              <UserIcon size={19} strokeWidth={1.5} />
            </Link>
            {isAdmin && (
              <NextLink href="/admin" aria-label="Admin" className={`${iconBase} hidden lg:inline-flex`}>
                <Shield size={18} strokeWidth={1.5} />
              </NextLink>
            )}
            <Link href="/cart" aria-label={t("cart")} className="inline-flex h-10 items-center gap-1.5 pl-2 pr-2 text-[14px] text-[color:var(--color-text)] transition-opacity hover:opacity-60">
              <span className="hidden sm:inline">Bag</span>
              <motion.span
                key={cartBounce}
                initial={cartBounce > 0 ? { scale: 0.6 } : false}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 400 }}
                className={`inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums ${
                  itemCount > 0
                    ? "bg-[color:var(--color-sun)] text-[#111111]"
                    : "border border-[color:var(--color-border-strong)] text-[color:var(--color-text-secondary)]"
                }`}
              >
                {itemCount > 99 ? "99+" : itemCount}
              </motion.span>
            </Link>
          </div>
        </div>

        {/* Mega menu */}
        <AnimatePresence>
          {openDept && activeNav && (
            <motion.div
              key="mega"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onMouseEnter={() => openMenu(openDept)}
              className="absolute inset-x-0 top-full hidden border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)] lg:block"
            >
              <div className="hw-container grid grid-cols-[220px_1fr] gap-12 py-10">
                <div className="flex flex-col gap-3">
                  <span className="font-serif text-[40px] leading-none">{activeNav.label}</span>
                  <Link href={activeNav.href} className="hw-link mt-2 text-[14px]">
                    Shop all {activeNav.label.toLowerCase()}
                  </Link>
                  <Link href={`${activeNav.href}?sort=newest`} className="text-[14px] text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text)]">
                    New in
                  </Link>
                </div>
                <MegaMenuGroups dept={activeDept} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search panel */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-x-0 top-full border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)]"
            >
              <form onSubmit={handleSearch} className="hw-container flex items-center gap-4 py-6" role="search">
                <Search size={22} strokeWidth={1.25} className="shrink-0 text-[color:var(--color-text-tertiary)]" />
                <input
                  ref={searchInput}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tees, hoodies, swimwear…"
                  aria-label="Search products"
                  className="min-w-0 flex-1 bg-transparent font-serif text-[28px] text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-tertiary)] focus:outline-none sm:text-[36px]"
                />
                <button
                  type="submit"
                  className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[color:var(--color-primary)] px-5 text-[14px] font-medium text-[color:var(--color-primary-fg)] transition-colors hover:bg-[color:var(--color-primary-hover)]"
                >
                  Search <ArrowRight size={15} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-[88%] max-w-sm flex-col bg-[color:var(--color-bg)]"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              aria-label="Menu"
            >
              <div className="flex h-16 items-center justify-between border-b border-[color:var(--color-border)] px-5">
                <HafwearLogo size={20} />
                <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className={`${iconButton} -mr-2`}>
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              <form onSubmit={handleSearch} className="border-b border-[color:var(--color-border)] px-5 py-3" role="search">
                <div className="flex items-center gap-2 border-b border-[color:var(--color-border-strong)] pb-2">
                  <Search size={16} strokeWidth={1.5} className="text-[color:var(--color-text-tertiary)]" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search Hafwear"
                    aria-label="Search products"
                    className="min-w-0 flex-1 bg-transparent text-[15px] focus:outline-none"
                  />
                </div>
              </form>

              <nav className="flex-1 overflow-y-auto px-5 py-2" aria-label="Mobile">
                {NAV.map((item) => (
                  <MobileNavItem key={item.label} item={item} tree={item.dept ? deptTree(item.dept) : undefined} />
                ))}
                <div className="my-4 h-px bg-[color:var(--color-border)]" />
                {[
                  { href: "/about", label: "Our story" },
                  { href: "/size-guide", label: "Size guide" },
                  { href: "/faq", label: "FAQ" },
                  { href: "/contact", label: t("contact") },
                ].map((l) => (
                  <Link key={l.href} href={l.href} className="block py-2.5 text-[15px] text-[color:var(--color-text-secondary)]">
                    {l.label}
                  </Link>
                ))}
                {isAdmin && (
                  <NextLink href="/admin" className="block py-2.5 text-[15px] text-[color:var(--color-text-secondary)]">
                    Admin panel
                  </NextLink>
                )}
              </nav>

              <div className="flex items-center justify-between border-t border-[color:var(--color-border)] px-5 py-3">
                <Link href={user ? "/account" : "/auth/login"} className="inline-flex items-center gap-2 text-[15px]">
                  <UserIcon size={18} strokeWidth={1.5} />
                  {user ? "My account" : "Sign in"}
                </Link>
                <div className="flex items-center">
                  <CurrencySwitcher />
                  <ThemeToggle />
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function MobileNavItem({ item, tree }: { item: NavItem; tree?: Category }) {
  const [open, setOpen] = useState(false);
  const groups = (tree?.children ?? []).filter((c) => subtreeCount(c) > 0);

  if (!groups.length) {
    return (
      <Link
        href={item.href}
        className={`block py-3 font-serif text-[26px] leading-tight ${item.label === "Sale" ? "text-[color:var(--color-sale)]" : ""}`}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-3 font-serif text-[26px] leading-tight"
      >
        {item.label}
        <ChevronDown size={18} strokeWidth={1.5} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="flex flex-col gap-1 pb-3 pl-1">
          <Link href={item.href} className="py-1.5 text-[15px] font-medium">
            Shop all {item.label.toLowerCase()}
          </Link>
          {groups.map((g) => (
            <Link key={g.id} href={`/catalog/${g.slug}`} className="py-1.5 text-[15px] text-[color:var(--color-text-secondary)]">
              {niceLabel(g.name)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Departments with deep trees get one column per subcategory; flat ones
 * (subcategories without children of their own) become a simple link list.
 */
function MegaMenuGroups({ dept }: { dept?: Category }) {
  if (!dept) {
    return <p className="text-[14px] text-[color:var(--color-text-secondary)]">Loading categories…</p>;
  }

  const groups = (dept.children ?? []).filter((c) => subtreeCount(c) > 0);
  const leavesOf = (g: Category) => (g.children ?? []).filter((c) => subtreeCount(c) > 0);
  const flat = groups.filter((g) => leavesOf(g).length === 0);
  const deep = groups.filter((g) => leavesOf(g).length > 0);
  const linkClass = "text-[15px] text-[color:var(--color-text)] hover:underline hover:underline-offset-4";

  return (
    <div className="grid grid-cols-4 gap-x-10 gap-y-8">
      {flat.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <span className="text-[12px] uppercase tracking-[0.1em] text-[color:var(--color-text-tertiary)]">Categories</span>
          {flat.map((g) => (
            <Link key={g.id} href={`/catalog/${g.slug}`} className={linkClass}>
              {niceLabel(g.name)}
            </Link>
          ))}
        </div>
      )}
      {deep.map((group) => (
        <div key={group.id} className="flex flex-col gap-2.5">
          <Link
            href={`/catalog/${group.slug}`}
            className="text-[12px] uppercase tracking-[0.1em] text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-text)]"
          >
            {niceLabel(group.name)}
          </Link>
          {leavesOf(group).slice(0, 8).map((leaf) => (
            <Link key={leaf.id} href={`/catalog/${leaf.slug}`} className={linkClass}>
              {niceLabel(leaf.name)}
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
