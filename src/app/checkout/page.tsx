import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CircleHelp, ShieldCheck } from "lucide-react";

import { CheckoutExperience } from "@/features/checkout/checkout-experience";
import { BrandLogo } from "@/shared/ui/brand-logo";

export const metadata: Metadata = {
  title: "Matrícula | Veli",
  description: "Escolha seu curso, horário e conclua sua matrícula na Veli.",
};

export default function CheckoutPage() {
  return (
    <div className="min-h-[100dvh] bg-[#f5f8fc]">
      <header className="border-b border-[#dce4ee] bg-white/95">
        <div className="mx-auto flex h-[72px] w-full max-w-[1240px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-5 sm:gap-7">
            <BrandLogo />
            <span className="hidden h-6 w-px bg-border sm:block" />
            <Link
              href="/"
              className="hidden items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground sm:flex"
            >
              <ArrowLeft className="size-4" />
              Voltar ao site
            </Link>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
            <span className="hidden items-center gap-2 sm:flex">
              <ShieldCheck className="size-4 text-primary" />
              Ambiente seguro
            </span>
            <Link
              href="/suporte"
              className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-white text-foreground transition hover:border-primary/40 hover:text-primary sm:size-auto sm:border-0 sm:bg-transparent sm:p-0"
              aria-label="Acessar o suporte"
            >
              <CircleHelp className="size-5 sm:size-4" />
              <span className="hidden sm:ml-2 sm:inline">Precisa de ajuda?</span>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <CheckoutExperience mode="page" />
      </main>
    </div>
  );
}
