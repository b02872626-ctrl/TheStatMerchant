import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TheStatMerchant — Football, explained",
  description: "Sharp Premier League analysis, built for the group chat.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "TheStatMerchant — Football, explained",
    description: "Sharp Premier League analysis, built for the group chat.",
    images: ["/og.png"],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
