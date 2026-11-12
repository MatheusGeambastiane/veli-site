import { httpClient } from "@/shared/lib/http-client";

export type AccountOrder = {
  order_id: number;
  offer_name: string;
  course_name: string | null;
  created_at: string;
  status: string;
  checkout_status: string;
  payment_status: string;
  contract_acceptance_status: string;
  amount_due: string;
  payment_mode: string;
  payment_type: string;
  payment_installments: number | null;
};

export type AccountOrders = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AccountOrder[];
};

export function getAccountOrders(page: number) {
  return httpClient.get<AccountOrders>(`/hotsite/orders/?page=${page}`, { requiresAuth: true });
}

export function accountError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "details" in error) {
    const details = error.details;
    if (details && typeof details === "object") {
      for (const value of Object.values(details)) {
        if (typeof value === "string") return value;
        if (Array.isArray(value) && typeof value[0] === "string") return value[0];
      }
    }
  }
  return "Não foi possível concluir a solicitação. Tente novamente.";
}

export function isSessionExpired(error: unknown) {
  return !!error && typeof error === "object" && "status" in error && error.status === 401;
}
