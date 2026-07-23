import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mobile X-Ray Logistics",
  description: "Field dispatch and billing platform for portable X-ray services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <head>
        {/* Icon font: loaded as a real <link>, not a CSS @import — the @import in
            globals.css silently gets dropped by the Tailwind/PostCSS build and never
            fetches, leaving .material-symbols-outlined elements to render raw ligature
            text (e.g. "error", "check_circle") instead of glyphs. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
