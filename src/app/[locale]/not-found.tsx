import { Link } from "@/i18n/routing";
import { HafwearMark } from "@/components/layout/HafwearLogo";

export default function NotFound() {
  return (
    <div className="hw-container flex flex-col items-center py-28 text-center">
      <HafwearMark size={48} className="text-[color:var(--color-text)]" />
      <p className="mt-8 text-[12px] uppercase tracking-[0.12em] text-[color:var(--color-text-tertiary)]">Error 404</p>
      <h1 className="mt-4 font-serif text-[48px] leading-none sm:text-[64px]">This page has gone for a walk.</h1>
      <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
        The page you were looking for doesn&apos;t exist or has moved. Let&apos;s get you back to something
        worth browsing.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
        <Link
          href="/"
          className="inline-flex h-12 items-center rounded-full bg-[color:var(--color-primary)] px-7 text-[15px] font-medium text-[color:var(--color-primary-fg)] transition-colors hover:bg-[color:var(--color-primary-hover)]"
        >
          Back to home
        </Link>
        <Link href="/catalog" className="hw-link text-[15px]">
          Shop all
        </Link>
        <Link href="/contact" className="hw-link text-[15px]">
          Contact us
        </Link>
      </div>
    </div>
  );
}
