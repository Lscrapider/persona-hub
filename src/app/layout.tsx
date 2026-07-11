import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import { EffectModeProvider } from "@/effects/runtime/EffectMode";

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
    default: "Scra Atlas",
    template: "%s | Scra Atlas",
  },
  description: "A living personal technical archive.",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      className={leagueGothic.variable + " " + manrope.variable}
      data-effect-mode="static"
      data-entry-ritual="skip"
      data-locale="zh"
      data-scroll-behavior="smooth"
      lang="zh-Hans"
      suppressHydrationWarning
    >
      <body>
        <EffectModeProvider>{children}</EffectModeProvider>
      </body>
    </html>
  );
}
