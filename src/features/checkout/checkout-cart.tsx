"use client";

import Image from "next/image";
import {
  ArrowRight,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CheckoutCartItem } from "@/shared/lib/checkout-cart";

type CheckoutCartProps = {
  open: boolean;
  item: CheckoutCartItem | null;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  onRemove: () => void;
};

function formatPrice(price: string) {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) {
    return `R$ ${price}`;
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericPrice);
}

export function CheckoutCart({
  open,
  item,
  error,
  onOpenChange,
  onContinue,
  onRemove,
}: CheckoutCartProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[min(92vw,420px)] border-l border-white/10 bg-[#101b24] text-white sm:max-w-[420px]">
        <SheetTitle className="sr-only">Carrinho</SheetTitle>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 pb-5 pt-16">
          {error ? (
            <p className="rounded-xl border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100">
              {error}
            </p>
          ) : null}

          {item ? (
            <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-white text-foreground shadow-2xl shadow-black/10">
              <div className="flex items-start gap-4 p-5">
                <Image
                  src={item.offer.course.language.lang_icon}
                  alt={item.offer.course.language.name}
                  width={56}
                  height={56}
                  className="size-14 rounded-full border border-border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    {item.language.name}
                  </p>
                  <h2 className="mt-1 font-heading text-xl font-semibold tracking-[-0.02em]">
                    {item.offer.course.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Nível {item.offer.course.level.level}
                  </p>
                </div>
              </div>
              <div className="flex items-end justify-between gap-4 border-t border-border bg-muted/35 px-5 py-4">
                <div>
                  <p className="text-xs text-muted-foreground">Valor da oferta</p>
                  <p className="mt-1 font-heading text-2xl font-semibold">
                    {formatPrice(item.offer.price)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  aria-label="Remover oferta do carrinho"
                  onClick={onRemove}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.4rem] border border-dashed border-white/20 bg-white/5 p-6 text-center">
              <ShoppingBag className="mx-auto size-9 text-white/35" />
              <p className="mt-4 font-semibold">Seu carrinho está vazio</p>
              <p className="mt-2 text-sm leading-6 text-white/55">
                Escolha uma oferta para guardá-la aqui.
              </p>
            </div>
          )}

        </div>

        {item ? (
          <SheetFooter className="border-t border-white/10 px-6 py-5">
            <Button
              type="button"
              className="h-12 w-full rounded-xl"
              onClick={onContinue}
            >
              Continuar compra
              <ArrowRight className="size-4" />
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
