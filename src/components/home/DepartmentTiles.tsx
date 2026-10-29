import { SafeImage } from "@/components/shared/SafeImage/SafeImage";
import { Link } from "@/i18n/routing";

export interface DepartmentTile {
  label: string;
  href: string;
  imageUrl: string | null;
  count: number;
}

export function DepartmentTiles({ tiles }: { tiles: DepartmentTile[] }) {
  if (!tiles.length) return null;

  return (
    <section className="hw-container pb-20 lg:pb-28" aria-labelledby="departments-heading">
      <h2 id="departments-heading" className="sr-only">Shop by department</h2>
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href} className="group block">
            <div className="relative aspect-[3/4] overflow-hidden bg-[color:var(--color-image-bg)]">
              {tile.imageUrl && (
                <SafeImage
                  src={tile.imageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-contain p-[10%] mix-blend-multiply transition-transform duration-700 group-hover:scale-[1.03] dark:mix-blend-normal"
                />
              )}
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="font-serif text-[26px] leading-none sm:text-[30px]">{tile.label}</span>
              <span className="text-[13px] text-[color:var(--color-text-tertiary)] tabular-nums">{tile.count}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
