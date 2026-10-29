import { Link } from "@/i18n/routing";
import { HafwearMark } from "@/components/layout/HafwearLogo";
import { brand } from "@/lib/brand";

export function StoryBlock() {
  return (
    <section className="bg-[color:var(--color-bg-secondary)]">
      <div className="hw-container grid gap-10 py-20 md:grid-cols-[1fr_1.1fr] md:items-center lg:py-28">
        <div className="flex flex-col items-start">
          <HafwearMark size={56} className="text-[color:var(--color-text)]" />
          <p className="mt-8 font-serif text-[96px] italic leading-none sm:text-[128px]">{brand.story.word}</p>
          <p className="mt-4 text-[15px] text-[color:var(--color-text-secondary)]">
            {brand.story.pronunciation} · noun · {brand.story.meaning}
          </p>
        </div>
        <div className="max-w-xl">
          <h2 className="font-serif text-[34px] leading-[1.08] sm:text-[42px]">
            Named after the season everyone waits for.
          </h2>
          <p className="mt-6 text-[16px] leading-relaxed text-[color:var(--color-text-secondary)]">
            We are a small team in {brand.company.address.city}, South Wales. Summer here is short and
            precious — long light evenings, salt in the air, clothes you don&apos;t have to think about. We make
            Hafwear to bottle that feeling: honest basics for the whole family that are easy to wear on
            the brightest day of the year, and the greyest.
          </p>
          <p className="mt-4 text-[16px] leading-relaxed text-[color:var(--color-text-secondary)]">
            Every piece is made to order, so nothing sits in a warehouse waiting to be wanted.
          </p>
          <Link href="/about" className="hw-link mt-8 inline-block text-[15px]">
            Read our story
          </Link>
        </div>
      </div>
    </section>
  );
}
