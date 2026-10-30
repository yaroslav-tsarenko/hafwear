"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { FaLinkedinIn, FaInstagram } from "react-icons/fa6";
import { ArrowRight } from "lucide-react";
import { HafwearLogo } from "../HafwearLogo";
import { brand, brandAddressLine } from "@/lib/brand";
import visaLogo from "@/assets/visa-logo.svg";
import mastercardLogo from "@/assets/mastercard-logo.svg";
import pciDssLogo from "@/assets/pci-dss-compliant-logo-vector.svg";

const columns = [
  {
    title: "Shop",
    links: [
      { href: "/catalog/women", label: "Women" },
      { href: "/catalog/men", label: "Men" },
      { href: "/catalog/kids", label: "Kids" },
      { href: "/catalog/women-swimwear", label: "Swim" },
      { href: "/catalog?sort=newest", label: "New in" },
      { href: "/catalog?onSale=true", label: "Sale" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/policies/shipping", label: "Delivery" },
      { href: "/policies/returns", label: "Returns" },
      { href: "/size-guide", label: "Size guide" },
      { href: "/policies/payment", label: "Payment" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    title: "Hafwear",
    links: [
      { href: "/about", label: "Our story" },
      { href: "/policies", label: "Policies" },
      { href: "/account", label: "My account" },
    ],
  },
];

const legalLinks = [
  { href: "/policies/privacy", label: "Privacy" },
  { href: "/policies/terms", label: "Terms" },
  { href: "/policies/cookies", label: "Cookies" },
];

export function Footer() {
  const t = useTranslations("footer");
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="mt-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
      <div className="hw-container">
        {/* Newsletter */}
        <div className="grid gap-8 border-b border-[color:var(--color-border)] py-16 lg:grid-cols-2 lg:items-end lg:gap-16">
          <div>
            <h2 className="font-serif text-[40px] leading-[1.02] sm:text-[52px]">
              Letters from Bridgend.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
              New pieces, the odd quiet sale and a little news from Wales. A few times a month, never more.
            </p>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!email) return;
              try {
                await fetch("/api/newsletter", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                });
              } catch { /* silent */ }
              setSubscribed(true);
              setEmail("");
            }}
          >
            <label htmlFor="footer-email" className="text-[12px] uppercase tracking-[0.1em] text-[color:var(--color-text-tertiary)]">
              Email address
            </label>
            <div className="mt-2 flex items-center border-b border-[color:var(--color-text)]">
              <input
                id="footer-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="min-w-0 flex-1 bg-transparent py-3 text-[16px] placeholder:text-[color:var(--color-text-tertiary)] focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 py-3 pl-4 text-[14px] font-medium transition-opacity hover:opacity-60"
              >
                Subscribe <ArrowRight size={15} />
              </button>
            </div>
            <p className="mt-3 min-h-[1.25rem] text-[13px] text-[color:var(--color-text-secondary)]" aria-live="polite">
              {subscribed ? "Thank you — diolch! You're on the list." : "You can unsubscribe at any time."}
            </p>
          </form>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-2 gap-10 py-14 md:grid-cols-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" aria-label="Hafwear home">
              <HafwearLogo size={22} />
            </Link>
            <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-[color:var(--color-text-secondary)]">
              <span className="font-serif text-[17px] italic text-[color:var(--color-text)]">haf</span>{" "}
              {brand.story.pronunciation} — {brand.story.meaning}. Easy everyday clothes for the whole family.
            </p>
            <div className="mt-6 flex flex-col gap-1.5 text-[14px]">
              <a href={`mailto:${brand.contact.email}`} className="hover:underline hover:underline-offset-4">
                {brand.contact.email}
              </a>
            </div>
            <div className="mt-5 flex items-center gap-1">
              {process.env.NEXT_PUBLIC_INSTAGRAM_URL && (
                <a
                  href={process.env.NEXT_PUBLIC_INSTAGRAM_URL}
                  aria-label="Instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="-ml-2 inline-flex h-9 w-9 items-center justify-center transition-opacity hover:opacity-60"
                >
                  <FaInstagram size={16} />
                </a>
              )}
              {process.env.NEXT_PUBLIC_LINKEDIN_URL && (
                <a
                  href={process.env.NEXT_PUBLIC_LINKEDIN_URL}
                  aria-label="LinkedIn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center transition-opacity hover:opacity-60"
                >
                  <FaLinkedinIn size={15} />
                </a>
              )}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-[12px] uppercase tracking-[0.1em] text-[color:var(--color-text-tertiary)]">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[14px] hover:underline hover:underline-offset-4">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-6 border-t border-[color:var(--color-border)] py-8 text-[12px] text-[color:var(--color-text-secondary)] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1">
            <p>{t("copyright", { year: currentYear, storeName: brand.displayName })}</p>
            <p>
              {brand.company.legalName} · Company No. {brand.company.number} · {brandAddressLine}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {legalLinks.map((link) => (
              <Link key={link.label} href={link.href} className="hover:text-[color:var(--color-text)]">
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-3">
              {[
                { src: visaLogo, alt: "Visa" },
                { src: mastercardLogo, alt: "Mastercard" },
                { src: pciDssLogo, alt: "PCI DSS Compliant" },
              ].map(({ src, alt }) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={alt}
                  src={src.src}
                  alt={alt}
                  style={{ height: 24, width: "auto", maxWidth: "none" }}
                  className="shrink-0"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
