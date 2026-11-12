"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type SiteShellProps = {
  children: ReactNode;
  homeClassName: string;
  journeyClassName: string;
  journeyHeaders: Record<string, ReactNode>;
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
  journeyHeaders,
  journeyFooter,
  homeHeader,
  homeFooter,
  header,
  footer,
}: SiteShellProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const journeyHeader = journeyHeaders[pathname];
  const isJourney = Boolean(journeyHeader);
  return (
    <div
      className={
        isHome
          ? homeClassName
          : isJourney
            ? journeyClassName
            : "relative flex min-h-screen flex-col overflow-x-hidden"
      }
    >
      {isHome ? homeHeader : isJourney ? journeyHeader : header}
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      {isHome ? homeFooter : isJourney ? journeyFooter : footer}
    </div>
  );
}
