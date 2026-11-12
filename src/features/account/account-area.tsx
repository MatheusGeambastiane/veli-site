"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Loader2, ReceiptText, RefreshCw, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkoutService } from "@/features/checkout/services/checkout-service";
import { authSessionUpdatedEvent, notifyAuthSessionChanged } from "@/shared/lib/auth-session";
import { publicEnv } from "@/shared/lib/env";
import type { HotsiteAuthenticatedUser } from "@/shared/types";
import { accountError, getAccountOrders, isSessionExpired, type AccountOrders } from "./account-service";
import { ProfilePanel } from "./profile-panel";

const labels: Record<string, string> = {
  paid: "Pago", active: "Ativo", pending: "Aguardando pagamento", waiting_payment: "Aguardando pagamento",
  processing: "Em processamento", pending_payment: "Aguardando pagamento", pending_contract: "Aguardando contrato",
  failed: "Pagamento recusado", expired: "Expirado", canceled: "Cancelado", refunded: "Estornado",
  disputed: "Em disputa", chargeback: "Pagamento contestado", past_due: "Em atraso", overdue: "Vencido", draft: "Pedido criado",
};
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "America/Bahia" });

function Status({ value }: { value: string }) {
  const color = ["paid", "active"].includes(value) ? "bg-emerald-50 text-emerald-800"
    : ["failed", "canceled", "expired", "refunded", "disputed", "chargeback"].includes(value) ? "bg-rose-50 text-rose-800"
    : "bg-amber-50 text-amber-900";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${color}`}>{labels[value] ?? "Em análise"}</span>;
}

export function AccountArea({ section }: { section: "orders" | "profile" }) {
  const router = useRouter();
  const path = section === "orders" ? "/meus-pedidos" : "/meus-dados";
  const [user, setUser] = useState<HotsiteAuthenticatedUser | null>(null);
  const [orders, setOrders] = useState<AccountOrders | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const requireLogin = useCallback(() => {
    setUser(null);
    setOrders(null);
    router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [path, router]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [profile, history] = await Promise.all([
          checkoutService.getCurrentUser(),
          section === "orders" ? getAccountOrders(page) : Promise.resolve(null),
        ]);
        if (!cancelled) { setUser(profile.data); setOrders(history?.data ?? null); }
      } catch (failure) {
        if (!cancelled) {
          if (isSessionExpired(failure)) requireLogin();
          else setError(accountError(failure));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [page, reload, requireLogin, section]);

  useEffect(() => {
    // Revalidate after logout or profile changes elsewhere in this tab.
    const changed = () => { setError(null); setReload((value) => value + 1); };
    window.addEventListener(authSessionUpdatedEvent, changed);
    return () => window.removeEventListener(authSessionUpdatedEvent, changed);
  }, []);

  function refresh(nextPage = page) {
    setLoading(true); setError(null); setPage(nextPage); setReload((value) => value + 1);
  }

  return (
    <section className="page-shell py-10 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Minha conta · Veli</p>
            <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">{section === "orders" ? "Meus pedidos" : "Meus dados"}</h1>
            <p className="mt-3 text-muted-foreground">{section === "orders" ? "Acompanhe suas matrículas e o status de cada pagamento." : "Seus dados pessoais e de contato, sempre atualizados."}</p>
          </div>
          <a href={publicEnv.platformUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4">
            Acessar a plataforma <ArrowUpRight className="size-4" /><span className="sr-only">(nova aba)</span>
          </a>
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
          <nav aria-label="Minha conta" className="flex gap-2 lg:flex-col">
            {([{ href: "/meus-pedidos", label: "Meus pedidos", icon: ReceiptText }, { href: "/meus-dados", label: "Meus dados", icon: UserRound }]).map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} aria-current={path === href ? "page" : undefined}
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${path === href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
                <Icon className="size-4" />{label}
              </Link>
            ))}
          </nav>
          <div className="min-w-0" aria-busy={loading}>
            {loading ? <div role="status" className="flex min-h-60 items-center justify-center gap-3 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> Carregando sua conta…</div>
              : error ? <div role="alert" className="rounded-2xl border border-border bg-white p-8"><p>{error}</p><Button onClick={() => refresh()} variant="outline" className="mt-4 h-11 px-5">Tentar novamente</Button></div>
              : user ? section === "profile" ? <ProfilePanel user={user} onSessionExpired={requireLogin} onSaved={(updated) => { setUser(updated); notifyAuthSessionChanged(); }} />
              : orders ? <>
                <div className="mb-5 flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">{orders.count} {orders.count === 1 ? "pedido" : "pedidos"}</p>
                  <Button variant="ghost" onClick={() => refresh()} className="h-10"><RefreshCw className="size-4" /> Atualizar status</Button>
                </div>
                {orders.results.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-10 text-center sm:p-16">
                  <ReceiptText className="mx-auto size-9 text-primary" />
                  <h2 className="mt-5 font-heading text-2xl font-semibold">Sua próxima jornada começa aqui</h2>
                  <p className="mt-3 text-sm text-muted-foreground">Você ainda não tem pedidos. Escolha um curso para começar.</p>
                  <Link href="/cursos" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white">Conhecer os cursos</Link>
                </div> : <div className="space-y-4">
                  {orders.results.map((order) => <article key={order.order_id} className="rounded-2xl border border-border bg-white p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Pedido #{order.order_id} · <time dateTime={order.created_at}>{date.format(new Date(order.created_at))}</time></p>
                        <h2 className="mt-2 break-words font-heading text-xl font-semibold">{order.offer_name}</h2>
                        {order.course_name ? <p className="mt-1 text-sm text-muted-foreground">{order.course_name}</p> : null}
                      </div>
                      <Status value={order.status} />
                    </div>
                    <dl className="mt-6 grid gap-5 border-t border-border pt-5 sm:grid-cols-3">
                      <div><dt className="text-xs text-muted-foreground">Valor do pedido</dt><dd className="mt-2 font-semibold">{money.format(Number(order.amount_due))}{order.payment_mode === "monthly" ? " / mês" : ""}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">Forma de pagamento</dt><dd className="mt-2 text-sm">{order.payment_type === "pix" ? "Pix" : order.payment_type === "debit" ? "Débito" : "Cartão de crédito"}{order.payment_mode === "monthly" ? " · Mensal" : (order.payment_installments ?? 1) > 1 ? ` · ${order.payment_installments}x` : " · À vista"}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">Último pagamento</dt><dd className="mt-2"><Status value={order.payment_status} /></dd></div>
                    </dl>
                  </article>)}
                </div>}
                {orders.previous || orders.next ? <nav aria-label="Páginas de pedidos" className="mt-6 flex items-center justify-between gap-3">
                  <Button variant="outline" disabled={!orders.previous} onClick={() => refresh(page - 1)} className="h-10"><ChevronLeft className="size-4" /> Anterior</Button>
                  <span className="text-sm text-muted-foreground">Página {page}</span>
                  <Button variant="outline" disabled={!orders.next} onClick={() => refresh(page + 1)} className="h-10">Próxima <ChevronRight className="size-4" /></Button>
                </nav> : null}
              </> : null : null}
          </div>
        </div>
      </div>
    </section>
  );
}
