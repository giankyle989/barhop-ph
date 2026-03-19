import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0A0A0F, #1A1A2E)",
          borderRadius: "36px",
        }}
      >
        <span
          style={{
            fontSize: "120px",
            fontWeight: 700,
            background: "linear-gradient(135deg, #A855F7, #EC4899)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          B
        </span>
      </div>
    ),
    { ...size }
  );
}
