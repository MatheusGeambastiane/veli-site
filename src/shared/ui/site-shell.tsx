"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type SiteShellProps = {
  children: ReactNode;
  homeClassName: string;
  homeHeader: ReactNode;
  homeFooter: ReactNode;
  header: ReactNode;
  footer: ReactNode;
};

export function SiteShell({
  children,
  homeClassName,
  homeHeader,
  homeFooter,
  header,
  footer,
}: SiteShellProps) {
  const isHome = usePathname() === "/";
  return (
    <div
      className={
        isHome
          ? homeClassName
          : "relative flex min-h-screen flex-col overflow-x-hidden"
      }
    >
      {isHome ? homeHeader : header}
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      {isHome ? homeFooter : footer}
    </div>
  );
}
