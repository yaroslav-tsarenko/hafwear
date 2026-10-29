import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // ── Utility Links ──────────────────────────────────
    // All linkUrls must point to routes that exist in src/app/[locale]/*
    // to avoid 404s on click.
    const utilityLinks = [
      { label: "About Us", linkUrl: "/about", icon: "Info", position: "left", sortOrder: 0 },
      { label: "Shipping & Delivery", linkUrl: "/policies/shipping", icon: "Truck", position: "left", sortOrder: 1 },
      { label: "Returns", linkUrl: "/policies/returns", icon: "RotateCcw", position: "left", sortOrder: 2 },
      { label: "Size Guide", linkUrl: "/size-guide", icon: "Ruler", position: "left", sortOrder: 3 },
      { label: "Track Order", linkUrl: "/account/orders", icon: "Package", position: "left", sortOrder: 4 },
      { label: "Contact", linkUrl: "/contact", icon: "Phone", position: "right", sortOrder: 5 },
    ];

    for (const link of utilityLinks) {
      await prisma.utilityLink.upsert({
        where: { id: `seed-utility-${link.sortOrder}` },
        update: link,
        create: { id: `seed-utility-${link.sortOrder}`, ...link },
      });
    }

    // ── Promo Strip Items ──────────────────────────────
    const promoStripItems = [
      { icon: "Truck", title: "Free UK Delivery", subtitle: "On orders over £100", sortOrder: 0 },
      { icon: "RotateCcw", title: "Easy Returns", subtitle: "14-day return policy", sortOrder: 1 },
      { icon: "Leaf", title: "Sustainable Materials", subtitle: "Organic cottons & recycled polyesters", sortOrder: 2 },
      { icon: "Shield", title: "Secure Payment", subtitle: "SSL encrypted checkout", sortOrder: 3 },
      { icon: "Sparkles", title: "Fresh Drops Weekly", subtitle: "New arrivals every Friday", sortOrder: 4 },
    ];

    for (const item of promoStripItems) {
      await prisma.promoStripItem.upsert({
        where: { id: `seed-promo-${item.sortOrder}` },
        update: item,
        create: { id: `seed-promo-${item.sortOrder}`, ...item },
      });
    }

    // ── Homepage Tabs ──────────────────────────────────
    // Offers / New / Outlet all resolve to the catalog with query params
    // — no dedicated pages exist and the catalog handles ?onSale and ?sort.
    const tabs = [
      { label: "Offers", icon: "Flame", linkUrl: "/catalog?onSale=true", color: "#E53935", sortOrder: 0 },
      { label: "Men", icon: "User", linkUrl: "/catalog/men", color: "#1F2937", sortOrder: 1 },
      { label: "Women", icon: "PersonStanding", linkUrl: "/catalog/women", color: "#BE185D", sortOrder: 2 },
      { label: "Kids", icon: "Baby", linkUrl: "/catalog/kids", color: "#0EA5E9", sortOrder: 3 },
      { label: "Swimwear", icon: "Waves", linkUrl: "/catalog/women-swimwear", color: "#0891B2", sortOrder: 4 },
      { label: "T-shirts", icon: "Shirt", linkUrl: "/catalog/men-t-shirts", color: "#334155", sortOrder: 5 },
      { label: "Hoodies", icon: "Layers", linkUrl: "/catalog/men-sweatshirts", color: "#7C3AED", sortOrder: 6 },
      { label: "New Arrivals", icon: "Sparkles", linkUrl: "/catalog?sort=newest", color: "#F59E0B", sortOrder: 7 },
      { label: "Outlet", icon: "Tag", linkUrl: "/catalog?onSale=true", color: "#EA580C", sortOrder: 8 },
    ];

    for (const tab of tabs) {
      await prisma.homepageTab.upsert({
        where: { id: `seed-tab-${tab.sortOrder}` },
        update: tab,
        create: { id: `seed-tab-${tab.sortOrder}`, ...tab },
      });
    }

    // ── Hero Slides (Banners type HERO) ────────────────
    const heroSlides = [
      {
        type: "HERO" as const,
        title: "Refined athletic apparel",
        subtitle: "For men, women and kids",
        description: "Sustainably sourced tees, hoodies, leggings and swimwear — shipped from the UK with free delivery over £100.",
        linkUrl: "/catalog",
        ctaLabel: "Shop the edit",
        bgColor: "#0F172A",
        textColor: "#ffffff",
        badgeText: "NEW SEASON",
        sortOrder: 0,
      },
      {
        type: "HERO" as const,
        title: "Women's Swimwear Edit",
        subtitle: "Made for sunlight",
        description: "High-rise bikinis, one-pieces and cover-ups in vivid, print-forward palettes.",
        linkUrl: "/catalog/women-swimwear",
        ctaLabel: "Shop swimwear",
        bgColor: "#0891B2",
        textColor: "#ffffff",
        badgeText: "SUMMER",
        sortOrder: 1,
      },
      {
        type: "HERO" as const,
        title: "Kids Collection",
        subtitle: "Playful, printed, hard-wearing",
        description: "All-over prints, organic cotton tees and cozy hoodies built for everyday adventures.",
        linkUrl: "/catalog/kids",
        ctaLabel: "Shop kids",
        bgColor: "#F59E0B",
        textColor: "#ffffff",
        badgeText: "FAMILY",
        sortOrder: 2,
      },
    ];

    for (let i = 0; i < heroSlides.length; i++) {
      await prisma.banner.upsert({
        where: { id: `seed-hero-${i}` },
        update: heroSlides[i],
        create: { id: `seed-hero-${i}`, ...heroSlides[i] },
      });
    }

    // ── Deal Cards (Banners type DEAL_CARD) ────────────
    const dealCards = [
      {
        type: "DEAL_CARD" as const,
        title: "HAFWEAR Performance Leggings",
        subtitle: "Compression fit",
        description: "Quick-dry technical leggings with a supportive high waist — built for the studio, the run, the day.",
        linkUrl: "/catalog/women-bottoms",
        ctaLabel: "Shop now",
        bgColor: "#F8F9FA",
        textColor: "#0F172A",
        oldPrice: "£45.00",
        newPrice: "£36.50",
        discountText: "-20%",
        sortOrder: 0,
      },
      {
        type: "DEAL_CARD" as const,
        title: "Champion Sweatshirt",
        subtitle: "Heavyweight fleece",
        description: "Iconic fit, brushed inside, built to outlast the season. A wardrobe cornerstone.",
        linkUrl: "/catalog/men-sweatshirts",
        ctaLabel: "Shop now",
        bgColor: "#F1F5F9",
        textColor: "#0F172A",
        oldPrice: "£65.00",
        newPrice: "£54.00",
        discountText: "-17%",
        sortOrder: 1,
      },
    ];

    for (let i = 0; i < dealCards.length; i++) {
      await prisma.banner.upsert({
        where: { id: `seed-deal-${i}` },
        update: dealCards[i],
        create: { id: `seed-deal-${i}`, ...dealCards[i] },
      });
    }

    // ── Small Promo Banners ────────────────────────────
    const smallPromos = [
      {
        type: "PROMO_SMALL" as const,
        title: "Men",
        subtitle: "Tees, hoodies & bottoms",
        linkUrl: "/catalog/men",
        ctaLabel: "Shop Men",
        bgColor: "#1F2937",
        textColor: "#ffffff",
        sortOrder: 0,
      },
      {
        type: "PROMO_SMALL" as const,
        title: "Women",
        subtitle: "Everyday to activewear",
        linkUrl: "/catalog/women",
        ctaLabel: "Shop Women",
        bgColor: "#FCE7F3",
        textColor: "#9D174D",
        sortOrder: 1,
      },
      {
        type: "PROMO_SMALL" as const,
        title: "Kids",
        subtitle: "Built for play",
        linkUrl: "/catalog/kids",
        ctaLabel: "Shop Kids",
        bgColor: "#DBEAFE",
        textColor: "#1E40AF",
        sortOrder: 2,
      },
    ];

    for (let i = 0; i < smallPromos.length; i++) {
      await prisma.banner.upsert({
        where: { id: `seed-promo-small-${i}` },
        update: smallPromos[i],
        create: { id: `seed-promo-small-${i}`, ...smallPromos[i] },
      });
    }

    // ── Wide Promo Banner ──────────────────────────────
    const widePromo = {
      type: "PROMO_WIDE" as const,
      title: "Free UK shipping over £100",
      subtitle: "14-day returns on every order",
      description: "Sustainably sourced apparel shipped from the United Kingdom. No fine print, no surprises.",
      linkUrl: "/catalog",
      ctaLabel: "Shop the edit",
      bgColor: "#ECFDF5",
      textColor: "#065F46",
      badgeText: "ALWAYS ON",
      sortOrder: 0,
    };

    await prisma.banner.upsert({
      where: { id: "seed-promo-wide-0" },
      update: widePromo,
      create: { id: "seed-promo-wide-0", ...widePromo },
    });

    // ── Brands ─────────────────────────────────────────
    // Apparel POD/wholesale brands that ship the pieces in our catalog.
    // linkUrl points to /catalog since we don't ship a /brands/[slug] route
    // — clicking a brand should land on the full catalog for now.
    const brands = [
      "Champion", "Gildan", "Bella + Canvas", "Lane Seven",
      "Stanley/Stella", "Comfort Colors", "AS Colour", "Next Level",
      "Cotton Heritage", "Independent Trading Co.", "Just Hoods", "Awdis",
    ];

    for (let i = 0; i < brands.length; i++) {
      const slug = brands[i].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      await prisma.brand.upsert({
        where: { id: `seed-brand-${i}` },
        update: { name: brands[i], logoUrl: `/brands/${slug}.svg`, linkUrl: `/catalog`, sortOrder: i },
        create: {
          id: `seed-brand-${i}`,
          name: brands[i],
          logoUrl: `/brands/${slug}.svg`,
          linkUrl: `/catalog`,
          sortOrder: i,
        },
      });
    }

    // ── Homepage Sections ──────────────────────────────
    // categorySlug values must match Category.slug rows imported from the WooCommerce export.
    const sections = [
      {
        title: "Best Deals",
        subtitle: "Save on selected pieces",
        slug: "best-deals",
        filterType: "onSale",
        maxProducts: 5,
        viewAllUrl: "/catalog?onSale=true",
        viewAllLabel: "View all deals",
        bgStyle: "white",
        columns: 5,
        sortOrder: 0,
      },
      {
        title: "New Arrivals",
        subtitle: "Fresh in this week",
        slug: "new-arrivals",
        filterType: "newest",
        maxProducts: 5,
        viewAllUrl: "/catalog?sort=newest",
        viewAllLabel: "View all new",
        bgStyle: "gray",
        columns: 5,
        sortOrder: 1,
      },
      {
        title: "Men's Essentials",
        subtitle: "Tees, hoodies and bottoms",
        slug: "mens-essentials",
        filterType: "category",
        categorySlug: "men",
        maxProducts: 5,
        viewAllUrl: "/catalog/men",
        viewAllLabel: "Shop Men",
        bgStyle: "white",
        columns: 5,
        sortOrder: 2,
      },
      {
        title: "Women's Edit",
        subtitle: "Everyday to activewear",
        slug: "womens-edit",
        filterType: "category",
        categorySlug: "women",
        maxProducts: 5,
        viewAllUrl: "/catalog/women",
        viewAllLabel: "Shop Women",
        bgStyle: "white",
        columns: 5,
        sortOrder: 3,
      },
      {
        title: "Swimwear",
        subtitle: "Made for the season",
        slug: "swimwear",
        filterType: "category",
        categorySlug: "women-swimwear",
        maxProducts: 5,
        viewAllUrl: "/catalog/women-swimwear",
        viewAllLabel: "Shop swimwear",
        bgStyle: "gray",
        columns: 5,
        sortOrder: 4,
      },
      {
        title: "Kids Collection",
        subtitle: "Built for play",
        slug: "kids-collection",
        filterType: "category",
        categorySlug: "kids",
        maxProducts: 5,
        viewAllUrl: "/catalog/kids",
        viewAllLabel: "Shop Kids",
        bgStyle: "white",
        columns: 5,
        sortOrder: 5,
      },
      {
        title: "Featured",
        subtitle: "Hand-picked by the team",
        slug: "featured",
        filterType: "featured",
        maxProducts: 5,
        viewAllUrl: "/catalog",
        viewAllLabel: "View all featured",
        bgStyle: "white",
        columns: 5,
        sortOrder: 6,
      },
      {
        title: "All Products",
        subtitle: "Browse the full catalog",
        slug: "all-products",
        filterType: "all",
        maxProducts: 10,
        viewAllUrl: "/catalog",
        viewAllLabel: "View all products",
        bgStyle: "white",
        columns: 5,
        sortOrder: 7,
      },
    ];

    for (const section of sections) {
      await prisma.homepageSection.upsert({
        where: { slug: section.slug },
        update: section,
        create: section,
      });
    }

    return NextResponse.json({
      success: true,
      seeded: {
        utilityLinks: utilityLinks.length,
        promoStripItems: promoStripItems.length,
        tabs: tabs.length,
        heroSlides: heroSlides.length,
        dealCards: dealCards.length,
        smallPromos: smallPromos.length,
        widePromos: 1,
        brands: brands.length,
        sections: sections.length,
      },
    });
  } catch (error) {
    console.error("Error seeding homepage data:", error);
    return NextResponse.json({ error: "Failed to seed homepage data" }, { status: 500 });
  }
}
