import { ImageResponse } from "next/og";

export const alt = "BarHop PH — Discover Bars & Clubs in the Philippines";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0A0A0F 0%, #1A1A2E 50%, #0A0A0F 100%)",
          position: "relative",
        }}
      >
        {/* Neon glow accent */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "300px",
            background: "radial-gradient(ellipse, rgba(168, 85, 247, 0.15) 0%, transparent 70%)",
          }}
        />
        {/* Logo text */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
          <span style={{ fontSize: "96px", fontWeight: 700, color: "#A855F7" }}>Bar</span>
          <span style={{ fontSize: "96px", fontWeight: 700, color: "#EC4899" }}>Hop</span>
          <span style={{ fontSize: "96px", fontWeight: 700, color: "#F8FAFC" }}> PH</span>
        </div>
        {/* Tagline */}
        <p style={{ fontSize: "32px", color: "#94A3B8", marginTop: "16px" }}>
          Discover Bars & Clubs in the Philippines
        </p>
      </div>
    ),
    { ...size }
  );
}
