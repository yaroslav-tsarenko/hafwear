"use client";

import { Link } from "@/i18n/routing";

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, subtitle, actionLabel, actionHref, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      {icon && <div className="text-[color:var(--color-text-tertiary)]">{icon}</div>}
      <h3 className="font-serif text-[32px] leading-tight text-[color:var(--color-text)]">{title}</h3>
      {subtitle && <p className="max-w-sm text-[15px] text-[color:var(--color-text-secondary)]">{subtitle}</p>}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-2 inline-flex h-11 items-center rounded-full bg-[color:var(--color-primary)] px-6 text-[14px] font-medium text-[color:var(--color-primary-fg)] transition-colors hover:bg-[color:var(--color-primary-hover)]"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
