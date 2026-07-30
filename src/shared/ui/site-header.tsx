"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from "@/shared/config/site";
import { BrandLogo } from "@/shared/ui/brand-logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/82 backdrop-blur-md">
      <div className="hero-shell flex h-[76px] items-center justify-between">
        <div className="flex items-center gap-10">
          <BrandLogo />
          <nav className="hidden items-center gap-7 md:flex">
            {siteConfig.navigation.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-foreground transition hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="https://aluno.escolaveli.com/auth"
            className="text-sm font-semibold text-foreground transition hover:text-primary"
          >
            Entrar
          </Link>
          <Link
            href="/checkout"
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-[#0052cc]"
          >
            Matricular-se agora
          </Link>
        </div>

        <Sheet>
          <SheetTrigger
            className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-white transition hover:bg-muted md:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-[88%] max-w-sm bg-white p-0">
            <SheetHeader className="border-b border-border">
              <SheetTitle>
                <BrandLogo />
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 px-4 py-6">
              {siteConfig.navigation.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl px-4 py-3 text-base font-semibold text-foreground transition hover:bg-muted"
                >
                  {link.label}
                </Link>
              ))}
              {siteConfig.secondaryNavigation.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-2xl px-4 py-3 text-base font-semibold transition ${
                    link.href === "/checkout"
                      ? "bg-primary text-primary-foreground hover:bg-[#0052cc]"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
