import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClubTreasury AI",
  description:
    "AI-assisted programmable treasury for university clubs, built on Sui.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body>{children}</body>
    </html>
  );
}
