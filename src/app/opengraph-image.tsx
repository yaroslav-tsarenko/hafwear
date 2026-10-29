import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";

export const alt = `${brand.displayName} — ${brand.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#F2F1EE",
          color: "#111111",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <path d="M8 44a24 24 0 0 1 48 0z" fill="#E0A526" />
            <rect x="2" y="49" width="60" height="4" rx="2" fill="#111111" />
          </svg>
          <span style={{ fontSize: 56, fontWeight: 600, letterSpacing: "-0.03em" }}>hafwear</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <span style={{ fontSize: 84, lineHeight: 1.02, letterSpacing: "-0.03em", maxWidth: 900 }}>
            That summer feeling, all year round.
          </span>
          <span style={{ fontSize: 30, color: "#5F5E5A" }}>
            Everyday clothes for the whole family · Bridgend, Wales
          </span>
        </div>

        <span style={{ fontSize: 26, color: "#8E8C86" }}>{brand.domain}</span>
      </div>
    ),
    size,
  );
}
