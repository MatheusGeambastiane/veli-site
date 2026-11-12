"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type SiteShellProps = {
  children: ReactNode;
  homeClassName: string;
  journeyClassName: string;
  journeyHeader: ReactNode;
  journeyFooter: ReactNode;
  homeHeader: ReactNode;
  homeFooter: ReactNode;
  header: ReactNode;
  footer: ReactNode;
};

export function SiteShell({
  children,
  homeClassName,
  journeyClassName,
  journeyHeader,
  journeyFooter,
  homeHeader,
  homeFooter,
  header,
  footer,
}: SiteShellProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isPlacement = pathname === "/teste-de-nivel";
  return (
    <div
      className={
        isHome
          ? homeClassName
          : isPlacement
            ? journeyClassName
            : "relative flex min-h-screen flex-col overflow-x-hidden"
      }
    >
      {isHome ? homeHeader : isPlacement ? journeyHeader : header}
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      {isHome ? homeFooter : isPlacement ? journeyFooter : footer}
    </div>
  );
}
