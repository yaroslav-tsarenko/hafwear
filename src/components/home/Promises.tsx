const PROMISES = [
  { title: "Made to order", body: "Each piece is made when you order it — less waste, no dead stock." },
  { title: "Free UK delivery", body: "On every order over £100, dispatched from the UK." },
  { title: "14-day returns", body: "Not right? Send unworn pieces back within 14 days." },
  { title: "Secure checkout", body: "Card payments through a PCI DSS compliant provider." },
];

export function Promises() {
  return (
    <section className="hw-container pb-20 lg:pb-28">
      <ul className="grid gap-8 border-t border-[color:var(--color-border)] pt-10 sm:grid-cols-2 lg:grid-cols-4">
        {PROMISES.map((p, i) => (
          <li key={p.title}>
            <span className="text-[13px] tabular-nums text-[color:var(--color-text-tertiary)]">0{i + 1}</span>
            <h3 className="mt-3 text-[16px] font-medium">{p.title}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[color:var(--color-text-secondary)]">{p.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
