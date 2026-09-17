import type { Metadata } from "next";
import { Fraunces, Poppins } from "next/font/google";
import "./globals.css";
import { AnalyticsProvider } from "@/shared/analytics/analytics-provider";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Veli | Escola de Idiomas Online",
  description:
    "Plataforma institucional da Veli com cursos online, metodologia, suporte e início de matrícula.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${poppins.variable} h-full scroll-smooth antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full bg-background text-foreground"
      >
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
