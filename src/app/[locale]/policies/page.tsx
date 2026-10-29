import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { Link } from "@/i18n/routing";

export const metadata = { title: "Policies" };

const policies = [
  { label: "Terms and Conditions", href: "/policies/terms" },
  { label: "Shipping Policy", href: "/policies/shipping" },
  { label: "Privacy Policy", href: "/policies/privacy" },
  { label: "Cookie Policy", href: "/policies/cookies" },
  { label: "Returns, Refunds and Cancellation Policy", href: "/policies/returns" },
  { label: "Payment Policy", href: "/policies/payment" },
  { label: "Warranty Policy", href: "/policies/warranty" },
];

export default function PoliciesIndexPage() {
  return (
    <div className="hw-container pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Policies" }]} />
      <div className="mx-auto max-w-3xl">
      <h1 className="mb-5 mt-4 font-serif text-[44px] leading-none sm:text-[56px]">
        Policies
      </h1>
      <p className="mb-6 text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
        Please review our policies below. These policies govern your use of the Hafwear website and
        any purchases made through it.
      </p>
      <ul className="m-0 flex list-none flex-col border-t border-[color:var(--color-border)] p-0">
        {policies.map((policy) => (
          <li key={policy.href}>
            <Link
              href={policy.href}
              className="flex items-center justify-between border-b border-[color:var(--color-border)] py-4 text-[16px] text-[color:var(--color-text)] hover:underline hover:underline-offset-4"
            >
              {policy.label}
            </Link>
          </li>
        ))}
      </ul>
      </div>
    </div>
  );
}
