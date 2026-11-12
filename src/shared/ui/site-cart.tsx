"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import {
  ChevronDown,
  Loader2,
  LogOut,
  ShoppingBag,
  UserRound,
  ArrowUpRight,
  ReceiptText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { publicEnv } from "@/shared/lib/env";
import { CheckoutCart } from "@/features/checkout/checkout-cart";
import { checkoutService } from "@/features/checkout/services/checkout-service";
import {
  authSessionUpdatedEvent,
  notifyAuthSessionChanged,
} from "@/shared/lib/auth-session";
import {
  checkoutCartKey,
  checkoutCartUpdatedEvent,
  clearCheckoutCart,
  dispatchCheckoutCartAction,
  readCheckoutCart,
  saveCheckoutCartIntent,
  type CheckoutCartItem,
} from "@/shared/lib/checkout-cart";
import type { HotsiteAuthenticatedUser } from "@/shared/types";

function getUserName(user: HotsiteAuthenticatedUser | null) {
  return user?.first_name?.trim() || user?.student_full_name?.split(" ")[0] || "Minha conta";
}

function getUserFullName(user: HotsiteAuthenticatedUser) {
  return (
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.student_full_name ||
    "Minha conta"
  );
}

export function SiteCart() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState<CheckoutCartItem | null>(null);
  const [user, setUser] = useState<HotsiteAuthenticatedUser | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = async () => {
    setSessionLoading(true);

    try {
      const session = await checkoutService.getSessionStatus();

      if (!session.authenticated) {
        setUser(null);
        return;
      }

      const response = await checkoutService.getCurrentUser();
      setUser(response.data);
    } catch {
      setUser(null);
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadCartAndSession() {
      await Promise.resolve();

      if (!cancelled) {
        setItem(readCheckoutCart());
      }

      try {
        const session = await checkoutService.getSessionStatus();

        if (!session.authenticated) {
          if (!cancelled) {
            setUser(null);
          }
          return;
        }

        const response = await checkoutService.getCurrentUser();

        if (!cancelled) {
          setUser(response.data);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setSessionLoading(false);
        }
      }
    }

    const syncCart = () => setItem(readCheckoutCart());
    const syncStorage = (event: StorageEvent) => {
      if (event.key === checkoutCartKey) {
        syncCart();
      }
    };
    const syncSession = () => void refreshSession();

    void loadCartAndSession();
    window.addEventListener(checkoutCartUpdatedEvent, syncCart);
    window.addEventListener(authSessionUpdatedEvent, syncSession);
    window.addEventListener("storage", syncStorage);

    return () => {
      cancelled = true;
      window.removeEventListener(checkoutCartUpdatedEvent, syncCart);
      window.removeEventListener(authSessionUpdatedEvent, syncSession);
      window.removeEventListener("storage", syncStorage);
    };
  }, []);

  const handleContinue = () => {
    try {
      saveCheckoutCartIntent("continue");
    } catch {
      // O evento em memória ainda permite continuar na aba atual.
    }

    dispatchCheckoutCartAction("continue");
    setOpen(false);
    router.push("/checkout");
  };

  const handleRemove = () => {
    try {
      clearCheckoutCart();
    } catch {
      setError("Não foi possível remover a oferta neste navegador.");
      return;
    }

    setItem(null);
    dispatchCheckoutCartAction("removed");
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    setError(null);

    try {
      await checkoutService.logout();
      setUser(null);
      notifyAuthSessionChanged();
      router.refresh();
    } catch (logoutError) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : "Não foi possível encerrar a sessão."
      );
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        {sessionLoading ? (
          <span className="flex h-10 items-center px-2 text-muted-foreground" aria-label="Verificando sessão">
            <Loader2 className="size-4 animate-spin" />
          </span>
        ) : user ? (
          <Menu.Root>
            <Menu.Trigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 max-w-40 gap-2 rounded-full px-3"
                />
              }
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRound className="size-4" />
              </span>
              <span className="max-w-24 truncate text-sm font-semibold">
                {getUserName(user)}
              </span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner side="bottom" align="end" sideOffset={8} className="z-[70] outline-none">
                <Menu.Popup className="w-60 origin-top-right rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-xl shadow-black/10 outline-none transition data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
                  <div className="border-b border-border px-3 pb-3 pt-2">
                    <p className="truncate text-sm font-semibold">{getUserFullName(user)}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Menu.Item render={<Link href="/meus-pedidos" />} className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-3 text-sm outline-none data-highlighted:bg-muted">
                    <ReceiptText className="size-4" /> Meus pedidos
                  </Menu.Item>
                  <Menu.Item render={<Link href="/meus-dados" />} className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-3 text-sm outline-none data-highlighted:bg-muted">
                    <UserRound className="size-4" /> Meus dados
                  </Menu.Item>
                  <Menu.Item render={<a href={publicEnv.platformUrl} target="_blank" rel="noopener noreferrer" />} className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-3 text-sm outline-none data-highlighted:bg-muted">
                    <ArrowUpRight className="size-4" /> Acessar a plataforma
                    <span className="sr-only">(nova aba)</span>
                  </Menu.Item>
                  <Menu.Item
                    disabled={logoutLoading}
                    onClick={() => void handleLogout()}
                    className="mt-1 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-destructive outline-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-destructive/10"
                  >
                    {logoutLoading ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
                    Sair
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        ) : (
          <Link
            href="/login"
            className="px-2 text-sm font-semibold text-foreground transition hover:text-primary"
          >
            Entrar
          </Link>
        )}

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative size-10 rounded-full bg-white p-0 shadow-sm"
          aria-label={`Abrir carrinho com ${item ? "uma oferta" : "nenhuma oferta"}`}
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
        >
          <ShoppingBag className="size-4 text-primary" />
          {item ? (
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[0.65rem] font-bold text-primary-foreground">
              1
            </span>
          ) : null}
        </Button>
      </div>

      <CheckoutCart
        open={open}
        item={item}
        error={error}
        onOpenChange={setOpen}
        onContinue={handleContinue}
        onRemove={handleRemove}
      />
    </>
  );
}
