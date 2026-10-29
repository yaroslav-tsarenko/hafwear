/**
 * Central brand identity for Hafwear / JAYHALE LIMITED.
 * Import from here instead of hardcoding company details in components.
 *
 * "Haf" is Welsh for summer — the company is based in Bridgend, Wales.
 */

export const brand = {
  name: "hafwear",
  displayName: "Hafwear",
  domain: "hafwear.co.uk",
  url: "https://hafwear.co.uk",
  tagline: "That summer feeling, all year round.",
  description:
    "Hafwear — easy everyday clothes for the whole family. Tees, sweatshirts, hoodies, bottoms and swimwear for men, women and kids, from a small team in Bridgend, Wales.",
  applicationName: "Hafwear",
  story: {
    word: "haf",
    pronunciation: "/hɑːv/",
    meaning: "Welsh for summer",
  },

  company: {
    legalName: "JAYHALE LIMITED",
    number: "16020956",
    address: {
      line1: "Academy House",
      line2: "11 Dunraven Place",
      city: "Bridgend",
      region: "Mid Glamorgan",
      postcode: "CF31 1JF",
      country: "United Kingdom",
    },
  },

  contact: {
    email: "info@hafwear.co.uk",
    emailB2B: "b2b@hafwear.co.uk",
    phone: "+44 7915 921997",
    phoneHref: "tel:+447915921997",
  },

  social: {
    twitter: "@hafwear",
  },
} as const;

export const brandAddressLine = [
  brand.company.address.line1,
  brand.company.address.line2,
  brand.company.address.city,
  brand.company.address.region,
  brand.company.address.postcode,
  brand.company.address.country,
].join(", ");

export const brandLegalLine = `${brand.company.legalName} · Company No. ${brand.company.number} · ${brand.company.address.line1}, ${brand.company.address.line2}, ${brand.company.address.city}, ${brand.company.address.postcode}, ${brand.company.address.country}`;
