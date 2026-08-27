import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClubTreasury AI",
  description: "AI-powered programmable treasury for university clubs on Sui.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
