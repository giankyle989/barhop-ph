import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0F",
          borderRadius: "6px",
        }}
      >
        <span
          style={{
            fontSize: "22px",
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
