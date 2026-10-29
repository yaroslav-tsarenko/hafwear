"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    q: "How long does shipping take?",
    a: "Every item is made to order by Printful. Once your order is produced, delivery takes 5-8 business days. Free shipping is offered on orders over £100.",
  },
  {
    q: "What is your return policy?",
    a: "We offer a 14-day return policy on all items. Products must be unused and in their original packaging. Contact our support team to initiate a return.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes! We ship across the UK and to most EU countries. International shipping typically takes 7-14 business days depending on the destination.",
  },
  {
    q: "How can I track my order?",
    a: "Once your order ships, you'll receive a confirmation email with a tracking number. You can also track your order from your account dashboard.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept Visa, Mastercard, American Express, PayPal, and bank transfers. All payments are processed securely with SSL encryption.",
  },
  {
    q: "Can I change or cancel my order?",
    a: "Orders can be modified or cancelled within 1 hour of placement. After that, please contact our support team and we'll do our best to help.",
  },
  {
    q: "Do you offer gift wrapping?",
    a: "Yes! Gift wrapping is available at checkout for a small additional fee. You can also include a personalized message with your gift.",
  },
  {
    q: "How do I contact customer support?",
    a: "You can reach us via our contact form or email at info@hafwear.co.uk. We aim to respond within 24 hours on weekdays.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[color:var(--color-line)] transition-colors ${
        open ? "bg-[color:var(--color-bg-secondary)]" : "bg-[color:var(--color-bg-elevated)]"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 border-none bg-transparent px-5 py-[1.125rem] text-left"
      >
        <span className="text-[15px] font-semibold text-[color:var(--color-text)]">{q}</span>
        <ChevronDown
          size={18}
          className="shrink-0 text-[color:var(--color-text-tertiary)] transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-[1.125rem] text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="mx-auto w-full max-w-[var(--max-width)] px-4 pb-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "FAQ" }]} />

      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <span className="eyebrow">Help center</span>
          <h1 className="mb-3 mt-2 break-words font-serif text-3xl font-medium tracking-tight text-[color:var(--color-text)] sm:text-[40px]">
            Frequently Asked <span className="text-[color:var(--color-accent)]">Questions</span>
          </h1>
          <p className="text-base leading-relaxed text-[color:var(--color-text-secondary)] sm:text-lg">
            Everything you need to know about shopping with us
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </div>
  );
}
