import { Fira_Sans, Noto_Sans } from "next/font/google";
import localFont from "next/font/local";

export const heading = Fira_Sans({
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-veli-heading",
  display: "swap",
});
export const body = Noto_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-veli-body",
  display: "swap",
});
export const script = localFont({
  src: "../../features/home/fonts/Fineday-StyleOne.ttf",
  variable: "--font-veli-script",
  display: "swap",
});

export const veliFontClassName = `${heading.variable} ${body.variable} ${script.variable}`;
