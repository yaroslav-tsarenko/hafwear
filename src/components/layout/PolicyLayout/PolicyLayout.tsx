import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { ReactNode } from "react";

interface PolicyLayoutProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export function PolicyLayout({ title, lastUpdated, children }: PolicyLayoutProps) {
  return (
    <div className="hw-container pb-24 [overflow-wrap:anywhere] [word-break:break-word]">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Policies", href: "/policies" },
          { label: title },
        ]}
      />
      <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 mt-4 font-serif text-[44px] leading-[1.02] text-[color:var(--color-text)] sm:text-[56px]">
        {title}
      </h1>
      <div
        className="prose-policy text-[15px] leading-[1.75] text-[color:var(--color-text-secondary)] max-sm:text-sm max-sm:leading-[1.65] [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-[26px] [&_h2]:leading-tight [&_h2]:font-serif [&_h2]:text-[color:var(--color-text)] max-sm:[&_h2]:mt-6 max-sm:[&_h2]:text-base [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-[color:var(--color-text)] max-sm:[&_h3]:text-[15px] [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:ml-6 [&_ul]:mt-2 [&_ul]:list-disc [&_ul>li]:mb-1 [&_table]:my-4 [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:text-sm [&_th]:border [&_th]:border-[color:var(--color-line)] [&_th]:bg-[color:var(--color-bg-secondary)] [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium [&_th]:text-[color:var(--color-text)] [&_th]:[word-break:break-word] [&_td]:border [&_td]:border-[color:var(--color-line)] [&_td]:px-3 [&_td]:py-2 [&_td]:text-left [&_td]:[word-break:break-word]"
      >
        <p className="mb-4 text-sm text-[color:var(--color-text-tertiary)]">Last updated: {lastUpdated}</p>
        {children}
      </div>
      </div>
    </div>
  );
}

export function ContactBlock() {
  return (
    <div className="mt-2 bg-[color:var(--color-bg-secondary)] px-5 py-4 text-sm leading-relaxed">
      <p>
        <strong>ELVARDO LTD</strong>, trading as Hafwear
        <br />
        Registration number: 16020956
        <br />
        Registered office: Academy House, 11 Dunraven Place, Bridgend, Mid Glamorgan, CF31 1JF, United Kingdom
        <br />
        Email (general and wholesale enquiries): info@hafwear.com
      </p>
    </div>
  );
}
