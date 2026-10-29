export function ProductSkeleton({ count = 12, columns = 3 }: { count?: number; columns?: 3 | 4 }) {
  return (
    <div
      className={`grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:gap-y-14 ${
        columns === 4 ? "md:grid-cols-3 xl:grid-cols-4" : "md:grid-cols-3"
      }`}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col">
          <div className="aspect-[4/5] animate-pulse bg-[color:var(--color-image-bg)]" />
          <div className="mt-3 h-3 w-1/3 animate-pulse bg-[color:var(--color-bg-tertiary)]" />
          <div className="mt-2 h-3 w-4/5 animate-pulse bg-[color:var(--color-bg-tertiary)]" />
          <div className="mt-2 h-3 w-1/4 animate-pulse bg-[color:var(--color-bg-tertiary)]" />
        </div>
      ))}
    </div>
  );
}
