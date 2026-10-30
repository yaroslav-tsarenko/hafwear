# Rebrand brief: Ravora → Hafwear

Agreed via quiz on 2026-10-29. Products and catalogue stay unchanged.

## Name & domain
- **Hafwear** — "haf" is Welsh for "summer"; the company (ELVARDO LTD) is based in Bridgend, Wales.
- Primary: **hafwear.com**. Also register **hafwear.com** → 301 to .co.uk.
  Both were unregistered per Verisign / Nominet WHOIS on 2026-10-29 (register before announcing; check UKIPO trademarks).
- Email: info@hafwear.com, info@hafwear.com.
- **Ravora is dropped entirely** — no redirect, no mentions. Images move off images.ravora.co.uk to a new CDN host (images.hafwear.com).

## Positioning
- Audience: the whole family (25–45), quality everyday basics for themselves and their kids at fair prices.
- Story: open about the Welsh meaning of the name and the Bridgend origin.
- Tagline: **"That summer feeling, all year round."** (summer as a feeling, not a season — works in winter too).

## Visual direction — Soft Minimal
- References: COS, Arket, Toteme. Product-first, lots of whitespace, no carousels.
- Palette (light):
  - background `#F2F1EE`, surface `#FFFFFF`, text `#111111`
  - buttons `#111111` with white text
  - accent `#E0A526` (muted ochre sun) — small touches only: badges, logo mark, highlights
  - sale `#C2410C`
- Dark theme: **kept** — the theme switcher stays, with a dark version of this palette.
- Type: Inter Tight (UI/body) + Instrument Serif (display headings).
- Logo: geometric half-sun mark `◠` + lowercase sans wordmark "hafwear". The mark alone is the favicon / social avatar.

## Homepage
- Hero: split layout — large serif headline + CTA on the left, one large product photo on the right. Static.

## Scope
- In: every public storefront page (home, catalogue, product, cart, checkout, account, info/policy pages), logo, favicon, OG images, email templates, `src/lib/brand.ts`, messages, metadata/SEO.
- Admin: rename only (no redesign).
- Process: branch `rebrand/hafwear` → PR → review preview → merge.
