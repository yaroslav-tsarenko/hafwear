import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Ruler, Info } from "lucide-react";

export const metadata: Metadata = {
  title: "Size Guide",
  description:
    "Hafwear sizing guide — find your fit across our men's, women's and kids' collections. Chest, waist and hip measurements in cm and inches.",
};

const ADULT_TOPS = [
  { size: "XS",  chest: "82–86",   waist: "66–70",   hip: "89–93" },
  { size: "S",   chest: "86–91",   waist: "71–75",   hip: "94–98" },
  { size: "M",   chest: "92–97",   waist: "76–81",   hip: "99–103" },
  { size: "L",   chest: "98–103",  waist: "82–87",   hip: "104–108" },
  { size: "XL",  chest: "104–109", waist: "88–93",   hip: "109–113" },
  { size: "2XL", chest: "110–117", waist: "94–101",  hip: "114–121" },
  { size: "3XL", chest: "118–125", waist: "102–109", hip: "122–129" },
];

const KIDS_TOPS = [
  { size: "2T",  age: "2 years",   height: "89–94" },
  { size: "3T",  age: "3 years",   height: "95–102" },
  { size: "4T",  age: "4 years",   height: "103–110" },
  { size: "5T",  age: "5 years",   height: "111–116" },
  { size: "6",   age: "6 years",   height: "117–122" },
  { size: "6X",  age: "6X years",  height: "123–128" },
  { size: "8Y",  age: "7–8 years", height: "128–134" },
  { size: "10Y", age: "9–10 years", height: "134–140" },
  { size: "12Y", age: "11–12 years", height: "146–152" },
];

const HOW_TO = [
  { title: "Chest", detail: "Measure around the fullest part of your chest, under your arms. Keep the tape parallel to the floor." },
  { title: "Waist", detail: "Measure at the narrowest point of your waist — usually just above the belly button." },
  { title: "Hip",   detail: "Measure around the fullest part of your hips, roughly 20 cm below your waistline." },
];

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[color:var(--color-line)]">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead className="bg-[color:var(--color-bg-secondary)] text-left text-[color:var(--color-text)]">
          <tr>
            {headers.map((h) => (
              <th key={h} className="border-b border-[color:var(--color-line)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={i % 2 === 0 ? "bg-[color:var(--color-bg-elevated)]" : "bg-[color:var(--color-bg)]"}
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`border-b border-[color:var(--color-line)] px-4 py-3 ${
                    j === 0 ? "font-semibold text-[color:var(--color-text)]" : "text-[color:var(--color-text-secondary)]"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SizeGuidePage() {
  return (
    <div className="mx-auto w-full max-w-[var(--container-content)] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="mb-10 flex flex-col gap-3 border-b border-[color:var(--color-line)] pb-8 sm:mb-14">
        <span className="eyebrow">Hafwear · Guide</span>
        <h1 className="font-serif text-[36px] font-medium leading-tight tracking-tight text-[color:var(--color-text)] sm:text-[52px]">
          Size guide
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-[color:var(--color-text-secondary)] sm:text-lg">
          All measurements in centimetres. Our fits run true to modern
          international sizing — if you're between two sizes, size up for a
          relaxed silhouette or size down for a fitted look.
        </p>
      </div>

      {/* How to measure */}
      <section className="mb-14">
        <div className="mb-6 flex items-center gap-2 text-[color:var(--color-text)]">
          <Ruler size={18} className="text-[color:var(--color-primary)]" />
          <h2 className="font-serif text-2xl font-medium tracking-tight">
            How to measure
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {HOW_TO.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-5"
            >
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--color-primary)]">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Adult tops */}
      <section className="mb-14">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <div>
            <span className="eyebrow">Men &amp; Women</span>
            <h2 className="font-serif text-2xl font-medium tracking-tight text-[color:var(--color-text)]">
              Adult tops &amp; bottoms
            </h2>
          </div>
          <Link
            href="/catalog"
            className="hidden text-sm font-semibold text-[color:var(--color-primary)] hover:underline sm:inline-flex sm:items-center sm:gap-1"
          >
            Shop apparel <ArrowRight size={14} />
          </Link>
        </div>
        <Table
          headers={["Size", "Chest (cm)", "Waist (cm)", "Hip (cm)"]}
          rows={ADULT_TOPS.map((r) => [r.size, r.chest, r.waist, r.hip])}
        />
      </section>

      {/* Kids */}
      <section className="mb-14">
        <div className="mb-6">
          <span className="eyebrow">Kids</span>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-[color:var(--color-text)]">
            Kids &amp; youth
          </h2>
        </div>
        <Table
          headers={["Size", "Age", "Height (cm)"]}
          rows={KIDS_TOPS.map((r) => [r.size, r.age, r.height])}
        />
      </section>

      {/* Fit note */}
      <section className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-secondary)] p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <Info size={20} className="mt-0.5 shrink-0 text-[color:var(--color-primary)]" strokeWidth={1.5} />
          <div className="flex flex-col gap-2">
            <h3 className="text-base font-semibold text-[color:var(--color-text)]">
              A note on fit
            </h3>
            <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
              Individual measurements can vary by up to 5 % due to the natural
              stretch and shrinkage of our organic and recycled fabrics. If
              your order doesn't fit as expected, we offer 14-day returns
              — see our <Link href="/policies/returns" className="text-[color:var(--color-primary)] underline">returns policy</Link> or
              email <a href="mailto:info@hafwear.co.uk" className="text-[color:var(--color-primary)] underline">info@hafwear.co.uk</a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
