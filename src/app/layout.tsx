import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/providers/providers";

const inter = localFont({
  src: "../../public/fonts/InterVariable.ttf",
  variable: "--font-inter",
  display: "swap",
});

const abcFavorit = localFont({
  src: "../../public/fonts/ABCFavorit-Medium.woff2",
  variable: "--font-abc-favorit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AWS Frontend Auth Demo",
  description:
    "Next.js + Privy demo app for an AWS-branded authentication experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${abcFavorit.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
