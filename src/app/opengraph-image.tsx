import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = SITE.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social preview card (LinkedIn, X, WhatsApp, Slack…), black & white like the site.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "radial-gradient(ellipse at 50% 45%, #1c1c1c 0%, #030303 70%)",
          color: "#f2f2f2",
        }}
      >
        <div style={{ fontSize: 132, fontWeight: 700, letterSpacing: -4, display: "flex" }}>
          Cognavia<span style={{ fontWeight: 300, opacity: 0.8 }}>.ai</span>
        </div>
        <div style={{ fontSize: 30, letterSpacing: 10, marginTop: 24, opacity: 0.7, textTransform: "uppercase" }}>
          Build smarter with AI
        </div>
      </div>
    ),
    size,
  );
}
