import { ImageResponse } from "next/og";

export const alt = "FairAudit — Fair housing compliance for affordable & supportive housing";
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
          padding: 72,
          background: "linear-gradient(135deg, #0b1322 0%, #13213d 60%, #1f3563 100%)",
          color: "white",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="64" height="64" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill="#1c2b4a" />
            <path d="M16 6.5 25 11.5H7L16 6.5Z" fill="#d6b25e" />
            <rect x="9" y="13.5" width="2.6" height="8.5" rx="0.6" fill="#fff" />
            <rect x="14.7" y="13.5" width="2.6" height="8.5" rx="0.6" fill="#fff" />
            <rect x="20.4" y="13.5" width="2.6" height="8.5" rx="0.6" fill="#fff" />
            <rect x="7" y="23.5" width="18" height="2.2" rx="0.6" fill="#fff" />
          </svg>
          <span style={{ fontSize: 40, fontWeight: 700 }}>FairAudit</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <span style={{ fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: "#d6b25e", fontFamily: "sans-serif" }}>
            Fair housing compliance
          </span>
          <span style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, maxWidth: 980 }}>
            Every screening decision, lawful and defensible.
          </span>
        </div>
        <span style={{ fontSize: 24, color: "rgba(255,255,255,0.65)", fontFamily: "sans-serif" }}>
          For affordable, supportive &amp; homeless housing operators · FHA · FCRA · HUD guidance
        </span>
      </div>
    ),
    size
  );
}
