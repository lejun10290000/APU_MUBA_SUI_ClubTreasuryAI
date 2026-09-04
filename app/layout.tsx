import type { Metadata } from "next";
import { AppProviders } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://apumubasuiclubtreasuryai000.vercel.app"),
  title: "ClubTreasury AI",
  description:
    "AI-assisted programmable treasury for university clubs, built on Sui.",
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "ClubTreasury AI — Club funds, clearly governed",
    description:
      "AI-assisted budgeting, human-approved claims, and verifiable USDC payouts on Sui Testnet.",
    type: "website",
    url: "/",
    siteName: "ClubTreasury AI",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ClubTreasury AI — Club funds, clearly governed",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ClubTreasury AI — Club funds, clearly governed",
    description:
      "AI-assisted budgeting, human-approved claims, and verifiable USDC payouts on Sui Testnet.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
