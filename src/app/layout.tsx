import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import { TransitionProvider } from "@/components/transition/TransitionProvider";

import "./globals.css";

const leagueGothic = localFont({
  src: "../assets/fonts/league-gothic-latin.woff2",
  variable: "--font-league-gothic",
  display: "swap",
  style: "normal",
  weight: "400",
});

const manrope = localFont({
  src: "../assets/fonts/manrope-latin-variable.woff2",
  variable: "--font-manrope",
  display: "swap",
  style: "normal",
  weight: "200 800",
});

export const metadata: Metadata = {
  title: {
    default: "SCRA",
    template: "%s | SCRA",
  },
  description: "A cinematic portfolio built around one decisive project.",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      className={`${leagueGothic.variable} ${manrope.variable}`}
      data-scroll-behavior="smooth"
      lang="zh-Hans"
    >
      <body>
        <TransitionProvider>{children}</TransitionProvider>
      </body>
    </html>
  );
}
