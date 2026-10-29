import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { HafwearMark } from "@/components/layout/HafwearLogo";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "Haf is Welsh for summer. Hafwear makes easy everyday clothes for the whole family, from a small team in Bridgend, Wales.",
};

const values = [
  {
    title: "Made to order",
    desc: "Every piece is printed to order by our print partner Printful and delivered in 5–8 business days after production, so nothing is made that nobody wants.",
  },
  {
    title: "For the whole family",
    desc: "The same easy tees, sweats and swim from toddler sizes up to 6XL — one place for everyone's drawer.",
  },
  {
    title: "Soft and lasting",
    desc: "We choose soft, durable fabrics and prints that hold up wash after wash, because a favourite tee should stay a favourite.",
  },
  {
    title: "Fair and simple",
    desc: "Honest prices with VAT included, free delivery over £100 and 14 days to change your mind.",
  },
];

export default function AboutPage() {
  return (
    <div className="pb-24">
      <div className="hw-container">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Our story" }]} />
      </div>

      <section className="hw-container grid gap-12 pb-20 pt-6 md:grid-cols-[1.1fr_1fr] md:items-end lg:pb-28">
        <div>
          <p className="text-[12px] uppercase tracking-[0.12em] text-[color:var(--color-text-tertiary)]">Our story</p>
          <h1 className="mt-5 font-serif text-[56px] leading-[0.96] sm:text-[80px] lg:text-[104px]">
            <em className="italic">Haf</em> is Welsh for summer.
          </h1>
        </div>
        <p className="max-w-md text-[17px] leading-relaxed text-[color:var(--color-text-secondary)]">
          Hafwear is a small clothing brand from {brand.company.address.city}, South Wales. We make easy
          everyday clothes for women, men and kids — the kind you reach for without thinking, on the
          brightest day of the year and the greyest.
        </p>
      </section>

      <section className="bg-[color:var(--color-bg-secondary)]">
        <div className="hw-container grid gap-12 py-20 md:grid-cols-[auto_1fr] md:gap-20 lg:py-28">
          <HafwearMark size={72} className="text-[color:var(--color-text)]" />
          <div className="max-w-2xl space-y-6 text-[17px] leading-relaxed text-[color:var(--color-text-secondary)]">
            <p className="font-serif text-[32px] leading-[1.15] text-[color:var(--color-text)] sm:text-[40px]">
              Summer in Wales is short, so we&apos;ve learned to carry it with us.
            </p>
            <p>
              Long light evenings, a walk on the beach after school, the first warm Saturday in May. That
              feeling — easy, unhurried, together — is what we want our clothes to give you, whatever the
              weather is doing outside.
            </p>
            <p>
              So we keep things simple: soft basics, honest fits and prints with a bit of character, made
              to order and sent from the UK. No endless drops, no warehouse of unsold stock — just good
              everyday clothes for the people you spend your days with.
            </p>
          </div>
        </div>
      </section>

      <section className="hw-container py-20 lg:py-28">
        <h2 className="font-serif text-[40px] leading-none sm:text-[48px]">What we care about</h2>
        <ul className="mt-12 grid gap-10 border-t border-[color:var(--color-border)] pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <li key={v.title}>
              <span className="text-[13px] tabular-nums text-[color:var(--color-text-tertiary)]">0{i + 1}</span>
              <h3 className="mt-3 text-[17px] font-medium">{v.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[color:var(--color-text-secondary)]">{v.desc}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="hw-container">
        <div className="flex flex-col items-start gap-6 border-t border-[color:var(--color-border)] pt-12 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-serif text-[36px] leading-none sm:text-[44px]">Say hello — or <em className="italic">shwmae</em>.</h2>
            <p className="mt-4 max-w-md text-[15px] text-[color:var(--color-text-secondary)]">
              Questions about sizing, an order or wholesale? Write to{" "}
              <a href={`mailto:${brand.contact.email}`} className="hw-link text-[color:var(--color-text)]">
                {brand.contact.email}
              </a>
              .
            </p>
          </div>
          <Link
            href="/catalog?sort=newest"
            className="inline-flex h-12 items-center rounded-full bg-[color:var(--color-primary)] px-7 text-[15px] font-medium text-[color:var(--color-primary-fg)] transition-colors hover:bg-[color:var(--color-primary-hover)]"
          >
            Shop new in
          </Link>
        </div>
      </section>
    </div>
  );
}
