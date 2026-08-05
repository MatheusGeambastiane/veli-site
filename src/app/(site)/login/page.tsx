import type { Metadata } from "next";

import { LoginScreen } from "@/features/auth/login-screen";

export const metadata: Metadata = {
  title: "Entrar | Veli",
  description: "Entre na sua conta Veli para continuar sua matrícula.",
};

export default function LoginPage() {
  return <LoginScreen />;
}
