import type { Metadata } from "next";

import { LoginScreen } from "@/features/auth/login-screen";

export const metadata: Metadata = {
  title: "Entrar | Veli",
  description: "Entre na sua conta Veli para continuar sua matrícula.",
};

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" && ["/meus-pedidos", "/meus-dados", "/checkout"].includes(next) ? next : undefined;
  return <LoginScreen nextPath={nextPath} />;
}
