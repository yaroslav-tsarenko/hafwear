/**
 * Hafwear logo — a half-sun rising over a horizon line, followed by the
 * lowercase wordmark. "Haf" is Welsh for summer; the mark carries that idea
 * without needing the explanation.
 *
 * `size` is the wordmark font-size in px; the mark scales with it.
 * The sun is always ochre; the horizon and wordmark follow `currentColor`
 * so the logo works on light, dark and inverted surfaces.
 */
export function HafwearMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      className={className}
      style={{ flexShrink: 0 }}
    >
      <path d="M5 22a11 11 0 0 1 22 0z" fill="var(--color-sun)" />
      <rect x="2" y="24.5" width="28" height="2.25" rx="1.125" fill="currentColor" />
    </svg>
  );
}

export function HafwearLogo({
  size = 22,
  showMark = true,
  className,
}: {
  size?: number;
  showMark?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-end leading-none ${className ?? ""}`}
      style={{ gap: size * 0.32 }}
    >
      {showMark && <HafwearMark size={size * 1.25} />}
      <span
        className="font-sans font-semibold lowercase"
        style={{ fontSize: size, letterSpacing: "-0.035em", lineHeight: 0.9 }}
      >
        hafwear
      </span>
    </span>
  );
}
