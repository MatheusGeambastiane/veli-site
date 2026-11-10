import type { ReactNode } from "react";
import { Fira_Sans, Noto_Sans } from "next/font/google";
import localFont from "next/font/local";
import { SiteFooter } from "@/shared/ui/site-footer";
import { SiteHeader } from "@/shared/ui/site-header";
import { SiteShell } from "@/shared/ui/site-shell";
import { HomeHeader } from "@/features/home/home-header";
import { HomeFooter } from "@/features/home/home-footer";
import styles from "@/features/home/home.module.css";

const heading = Fira_Sans({
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-veli-heading",
  display: "swap",
});
const body = Noto_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-veli-body",
  display: "swap",
});
const script = localFont({
  src: "../../features/home/fonts/Fineday-StyleOne.ttf",
  variable: "--font-veli-script",
  display: "swap",
});

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <SiteShell
      homeClassName={`${styles.root} ${heading.variable} ${body.variable} ${script.variable}`}
      homeHeader={<HomeHeader />}
      homeFooter={<HomeFooter />}
      header={<SiteHeader />}
      footer={<SiteFooter />}
    >
      {children}
    </SiteShell>
  );
}
