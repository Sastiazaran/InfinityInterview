import type { Metadata, Viewport } from "next";
import { Cinzel, IBM_Plex_Mono, Pixelify_Sans, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const pixel = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin"],
});

const display = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  preload: false,
});

const sans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Bloodline: The Interview Castle",
  description:
    "A keyboard-first pixel adventure. Walk the castle, duel its guardians with interview questions and puzzles, earn gold, and climb Bloodline after Bloodline.",
};

export const viewport: Viewport = {
  themeColor: "#0b1324",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${pixel.variable} ${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
