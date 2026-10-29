"use client";

import { Link } from "@/i18n/routing";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="py-5 text-[13px]" aria-label="Breadcrumb">
      <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            {index > 0 && <span aria-hidden className="text-[color:var(--color-text-tertiary)]">/</span>}
            {item.href ? (
              <Link
                href={item.href}
                className="text-[color:var(--color-text-secondary)] transition-colors hover:text-[color:var(--color-text)]"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-[color:var(--color-text)]">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
