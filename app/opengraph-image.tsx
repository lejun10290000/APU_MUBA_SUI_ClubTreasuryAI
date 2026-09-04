import { ImageResponse } from "next/og";

export const alt = "ClubTreasury AI — Club funds, clearly governed";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background:
            "radial-gradient(circle at 82% 18%, #1d5b4f 0%, #0e2c27 42%, #081d19 100%)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Arial, sans-serif",
          height: "100%",
          justifyContent: "space-between",
          padding: "56px 64px",
          width: "100%",
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: 18 }}>
          <div
            style={{
              alignItems: "center",
              background: "#caff74",
              borderRadius: 18,
              color: "#0e2c27",
              display: "flex",
              fontSize: 30,
              fontWeight: 800,
              height: 64,
              justifyContent: "center",
              width: 64,
            }}
          >
            <span
              style={{
                borderBottom: "5px solid currentColor",
                borderTop: "5px solid currentColor",
                display: "flex",
                height: 22,
                width: 30,
              }}
            />
          </div>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>
            ClubTreasury AI
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: "#caff74",
              display: "flex",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            AI × Human approval × Sui
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: -4,
              lineHeight: 1.02,
              marginTop: 24,
              maxWidth: 920,
            }}
          >
            Club funds, clearly governed.
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.68)",
              display: "flex",
              fontSize: 26,
              lineHeight: 1.35,
              marginTop: 24,
              maxWidth: 960,
            }}
          >
            AI-assisted budgeting, deterministic safeguards, and verifiable USDC
            execution on Sui Testnet.
          </div>
        </div>

        <div
          style={{
            color: "rgba(255,255,255,0.48)",
            display: "flex",
            fontSize: 20,
            justifyContent: "space-between",
          }}
        >
          <span>MUBA Blockchain Hackathon 2026</span>
          <span>Gemini · Supabase · Sui</span>
        </div>
      </div>
    ),
    size,
  );
}
