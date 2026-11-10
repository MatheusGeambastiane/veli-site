"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { BrandLogo } from "@/shared/ui/brand-logo";
import { SiteCart } from "@/shared/ui/site-cart";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { homeNavigation } from "./home-content";

export function HomeHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="v-header">
      <a className="v-skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <div className="v-container v-header-inner">
        <BrandLogo />
        <nav aria-label="Navegação principal" className="v-desktop-nav">
          {homeNavigation.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="v-header-actions">
          <Link className="v-button v-header-enroll" href="/checkout">
            Matricular-se <span aria-hidden="true">↗</span>
          </Link>
          <SiteCart />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="v-menu-toggle" aria-label="Abrir menu">
              <Menu size={22} />
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#fff8e3] text-[#0b1f4d]">
              <SheetHeader>
                <SheetTitle>Explore a Veli</SheetTitle>
              </SheetHeader>
              <nav
                aria-label="Navegação móvel"
                className="flex flex-col gap-2 p-5"
              >
                {homeNavigation.map((link) => (
                  <Link
                    className="rounded-lg px-3 py-3 focus-visible:outline-2"
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  className="rounded-lg bg-[#2563eb] px-3 py-3 text-white"
                  href="/checkout"
                  onClick={() => setOpen(false)}
                >
                  Quero me matricular
                </Link>
                <Link
                  className="px-3 py-3"
                  href="/teste-de-nivel"
                  onClick={() => setOpen(false)}
                >
                  Descobrir meu nível
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
