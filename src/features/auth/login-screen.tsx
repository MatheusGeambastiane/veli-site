"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Languages,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleSignInButton } from "@/features/checkout/google-sign-in-button";
import { ProfileCompletionForm } from "@/features/checkout/profile-completion-form";
import { checkoutService } from "@/features/checkout/services/checkout-service";
import { notifyAuthSessionChanged } from "@/shared/lib/auth-session";
import { readCheckoutCart } from "@/shared/lib/checkout-cart";
import type {
  ApiError,
  HotsiteAuthenticatedUser,
  UpdateHotsiteUserPayload,
} from "@/shared/types";

function getApiErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const details = (error as ApiError).details;

    if (typeof details === "string" && details.trim()) {
      return details;
    }

    if (details && typeof details === "object") {
      const candidate = details as Record<string, unknown>;

      if (typeof candidate.detail === "string") {
        return candidate.detail;
      }

      for (const value of Object.values(candidate)) {
        if (typeof value === "string" && value.trim()) {
          return value;
        }

        if (Array.isArray(value) && typeof value[0] === "string") {
          return value[0];
        }
      }
    }
  }

  return "Não foi possível entrar. Confira seus dados e tente novamente.";
}

function getPostLoginPath() {
  return readCheckoutCart() ? "/checkout" : "/";
}

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUser, setProfileUser] =
    useState<HotsiteAuthenticatedUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const session = await checkoutService.getSessionStatus();

        if (session.authenticated && !cancelled) {
          router.replace(getPostLoginPath());
          return;
        }
      } catch {
        // A tela de login continua disponível quando a sessão não pode ser lida.
      }

      if (!cancelled) {
        setCheckingSession(false);
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const finishLogin = () => {
    notifyAuthSessionChanged();
    router.replace(getPostLoginPath());
    router.refresh();
  };

  const handleAuthenticatedUser = (user: HotsiteAuthenticatedUser) => {
    if (user.profile_completed === false) {
      notifyAuthSessionChanged();
      setProfileUser(user);
      return;
    }

    finishLogin();
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await checkoutService.authenticateUser({ email, password });
      handleAuthenticatedUser(response.data);
    } catch (loginError) {
      setError(getApiErrorMessage(loginError));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await checkoutService.authenticateWithGoogle({ credential });
      handleAuthenticatedUser(response.data);
    } catch (googleError) {
      setError(getApiErrorMessage(googleError));
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (payload: UpdateHotsiteUserPayload) => {
    setLoading(true);
    setError(null);

    try {
      await checkoutService.updateCurrentUser(payload);
      setProfileUser(null);
      finishLogin();
    } catch (profileError) {
      setError(getApiErrorMessage(profileError));
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-[calc(100vh-76px)] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="sr-only">Verificando sessão</span>
      </div>
    );
  }

  if (profileUser) {
    return (
      <section className="page-shell py-12 md:py-20">
        <div className="mx-auto max-w-3xl">
          <ProfileCompletionForm
            key={profileUser.id ?? profileUser.email}
            user={profileUser}
            submitting={loading}
            error={error}
            description="Complete seus dados para deixar sua conta pronta para as próximas matrículas."
            submitLabel="Salvar e continuar"
            onSubmit={handleCompleteProfile}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="page-shell py-10 sm:py-14 lg:py-20">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-border bg-white shadow-2xl shadow-primary/10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative hidden overflow-hidden bg-[#101b24] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-24 size-72 rounded-full border-[48px] border-primary/15" />
          <div className="relative">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary text-white">
              <Languages className="size-6" />
            </span>
            <h1 className="mt-8 max-w-sm font-heading text-4xl font-semibold leading-tight tracking-[-0.04em]">
              Continue sua jornada com a Veli.
            </h1>
            <p className="mt-4 max-w-sm leading-7 text-white/60">
              Entre para retomar sua matrícula e acessar suas escolhas com segurança.
            </p>
          </div>
          <div className="relative space-y-4 text-sm text-white/75">
            <p className="flex items-center gap-3">
              <CheckCircle2 className="size-4 text-[#96c1f6]" />
              Sua oferta continua no carrinho
            </p>
            <p className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-[#96c1f6]" />
              Sessão protegida em cookies seguros
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Área do aluno
            </p>
            <h2 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.04em] text-foreground">
              Entre na sua conta
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Use seu e-mail e senha ou continue com o Google.
            </p>

            {error ? (
              <p className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="login-email">E-mail</Label>
                <Input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 rounded-xl pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 text-muted-foreground"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="h-12 w-full rounded-xl" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                Entrar
                {!loading ? <ArrowRight className="size-4" /> : null}
              </Button>

              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                ou
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="rounded-xl bg-white">
                <GoogleSignInButton
                  disabled={loading}
                  onCredential={handleGoogleCredential}
                  onError={setError}
                />
              </div>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Ainda não tem uma conta?{" "}
              <Link href="/checkout" className="font-semibold text-primary hover:underline">
                Escolha seu curso
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
