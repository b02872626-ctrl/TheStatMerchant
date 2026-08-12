import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
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
