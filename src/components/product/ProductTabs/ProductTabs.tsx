"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { sanitizeProductDescription } from "@/lib/utils/sanitize-html";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string | null };
}

interface ProductTabsProps {
  description?: string | null;
  characteristics?: Record<string, Record<string, string>> | null;
  reviews: Review[];
}

function countCharacteristics(chars: Record<string, Record<string, string>>): number {
  return Object.values(chars).reduce((sum, group) => sum + Object.keys(group).length, 0);
}

const DESCRIPTION_CLASS = [
  "max-w-[78ch] text-[15px] leading-[1.75] text-[color:var(--color-text-secondary)]",
  "[&_p]:mb-4 [&_p:last-child]:mb-0",
  "[&_b]:font-bold [&_b]:text-[color:var(--color-text)] [&_strong]:font-bold [&_strong]:text-[color:var(--color-text)]",
  "[&_i]:italic [&_em]:italic",
  "[&_u]:underline",
  "[&_h1]:mb-3 [&_h1]:mt-8 [&_h1]:text-[1.75rem] [&_h1]:font-serif [&_h1]:text-[color:var(--color-text)]",
  "[&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-[1.5rem] [&_h2]:font-serif [&_h2]:text-[color:var(--color-text)]",
  "[&_h3]:mb-3 [&_h3]:mt-7 [&_h3]:text-[1.25rem] [&_h3]:font-serif [&_h3]:text-[color:var(--color-text)]",
  "[&_h4]:mb-3 [&_h4]:mt-7 [&_h4]:text-[0.95rem] [&_h4]:font-semibold [&_h4]:text-[color:var(--color-text)]",
  "[&_a]:text-[color:var(--color-text)] [&_a]:underline [&_a]:underline-offset-4",
  "[&_ul]:mb-5 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-5 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-6",
  "[&_li]:my-1 [&_li]:leading-relaxed",
  "[&_hr]:my-6 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-[color:var(--color-line)]",
].join(" ");

export function ProductTabs({ description, characteristics, reviews }: ProductTabsProps) {
  const t = useTranslations("product");
  const [activeTab, setActiveTab] = useState<"description" | "characteristics" | "reviews">("description");

  const groups = characteristics ? Object.entries(characteristics) : [];
  const totalCharCount = characteristics ? countCharacteristics(characteristics) : 0;
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const safeDescription = useMemo(
    () => (description ? sanitizeProductDescription(description) : ""),
    [description]
  );

  return (
    <div id="reviews" className="mt-20 scroll-mt-24 md:mt-28">
      <div className="flex overflow-x-auto border-b border-[color:var(--color-border)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
        <button
          className={`-mb-px mr-8 shrink-0 whitespace-nowrap border-b bg-transparent py-4 text-[15px] transition-colors ${
            activeTab === "description"
              ? "border-[color:var(--color-text)] text-[color:var(--color-text)]"
              : "border-transparent text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-text)]"
          }`}
          onClick={() => setActiveTab("description")}
          role="tab"
          aria-selected={activeTab === "description"}
        >
          {t("description")}
        </button>
        <button
          className={`-mb-px mr-8 shrink-0 whitespace-nowrap border-b bg-transparent py-4 text-[15px] transition-colors ${
            activeTab === "characteristics"
              ? "border-[color:var(--color-text)] text-[color:var(--color-text)]"
              : "border-transparent text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-text)]"
          }`}
          onClick={() => setActiveTab("characteristics")}
          role="tab"
          aria-selected={activeTab === "characteristics"}
        >
          {t("characteristics")}
          {totalCharCount > 0 && (
            <span className="ml-1 text-xs font-normal text-[color:var(--color-text-tertiary)]">({totalCharCount})</span>
          )}
        </button>
        <button
          className={`-mb-px mr-8 shrink-0 whitespace-nowrap border-b bg-transparent py-4 text-[15px] transition-colors ${
            activeTab === "reviews"
              ? "border-[color:var(--color-text)] text-[color:var(--color-text)]"
              : "border-transparent text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-text)]"
          }`}
          onClick={() => setActiveTab("reviews")}
          role="tab"
          aria-selected={activeTab === "reviews"}
        >
          {t("reviews", { count: reviews.length })}
        </button>
      </div>

      <div className="py-8 sm:py-10" role="tabpanel">
        {activeTab === "description" && (
          safeDescription ? (
            <div
              className={DESCRIPTION_CLASS}
              dangerouslySetInnerHTML={{ __html: safeDescription }}
            />
          ) : (
            <p className="py-8 text-center text-[15px] text-[color:var(--color-text-tertiary)]">-</p>
          )
        )}

        {activeTab === "characteristics" && (
          groups.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
              {groups.map(([groupName, entries]) => (
                <div key={groupName} className="flex flex-col">
                  <h3 className="mb-3 font-serif text-[24px] text-[color:var(--color-text)]">
                    {groupName}
                  </h3>
                  <table className="w-full border-collapse">
                    <tbody>
                      {Object.entries(entries).map(([key, value], i) => (
                        <tr key={key}>
                          <td className="w-[50%] border-b border-[color:var(--color-border)] py-2.5 pr-4 align-top text-[14px] text-[color:var(--color-text-secondary)]">{key}</td>
                          <td className="border-b border-[color:var(--color-border)] py-2.5 align-top text-[14px] text-[color:var(--color-text)]">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-[15px] text-[color:var(--color-text-tertiary)]">-</p>
          )
        )}

        {activeTab === "reviews" && (
          reviews.length > 0 ? (
            <>
              <div className="mb-8 flex items-center gap-6">
                <div className="text-center">
                  <div className="font-serif text-[56px] leading-none text-[color:var(--color-text)]">{avgRating.toFixed(1)}</div>
                  <div className="mt-1 text-lg tracking-[1px] text-[color:var(--color-sun-ink)]">
                    {"★".repeat(Math.round(avgRating))}{"☆".repeat(5 - Math.round(avgRating))}
                  </div>
                  <div className="mt-1 text-[13px] text-[color:var(--color-text-tertiary)]">
                    {reviews.length} {t("reviews", { count: reviews.length }).toLowerCase().replace(/\(\d+\)/, "").trim()}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
                {reviews.map((review) => (
                  <div key={review.id} className="border-t border-[color:var(--color-border)] pt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[15px] font-medium text-[color:var(--color-text)]">
                        {review.user.name || "Anonymous"}
                      </span>
                      <span className="text-sm tracking-[1px] text-[color:var(--color-sun-ink)]">
                        {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">{review.comment}</p>
                    )}
                    <div className="mt-3 text-xs text-[color:var(--color-text-tertiary)]">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="py-8 text-center text-[15px] text-[color:var(--color-text-tertiary)]">{t("noReviews")}</p>
          )
        )}
      </div>
    </div>
  );
}
