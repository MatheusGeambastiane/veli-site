"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import { publicEnv } from "@/shared/lib/env";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleIdentityApi = {
  accounts: {
    id: {
      initialize(config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        ux_mode: "popup";
      }): void;
      renderButton(
        parent: HTMLElement,
        options: {
          type: "standard";
          theme: "outline";
          size: "large";
          text: "continue_with";
          shape: "rectangular";
          logo_alignment: "left";
          locale: "pt-BR";
          width: number;
        }
      ): void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

type GoogleSignInButtonProps = {
  disabled?: boolean;
  onCredential: (credential: string) => void | Promise<void>;
  onError: (message: string) => void;
};

const googleClientId = publicEnv.googleClientId;

export function GoogleSignInButton({
  disabled = false,
  onCredential,
  onError,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const credentialHandlerRef = useRef(onCredential);
  const errorHandlerRef = useRef(onError);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);

  useEffect(() => {
    credentialHandlerRef.current = onCredential;
    errorHandlerRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    const container = containerRef.current;

    if (!scriptReady || !googleClientId || !window.google || !container) {
      return;
    }

    container.replaceChildren();
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      ux_mode: "popup",
      callback: (response) => {
        if (!response.credential) {
          errorHandlerRef.current(
            "O Google não retornou uma credencial válida. Tente novamente."
          );
          return;
        }

        void credentialHandlerRef.current(response.credential);
      },
    });
    window.google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      logo_alignment: "left",
      locale: "pt-BR",
      width: Math.min(Math.max(container.clientWidth, 240), 400),
    });
  }, [scriptReady]);

  if (!googleClientId) {
    return (
      <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-800">
        O login com Google está temporariamente indisponível. Configure o Client
        ID para habilitá-lo.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Script
        src="https://accounts.google.com/gsi/client?hl=pt-BR"
        strategy="afterInteractive"
        onReady={() => {
          setScriptFailed(false);
          setScriptReady(true);
        }}
        onError={() => {
          setScriptFailed(true);
          errorHandlerRef.current(
            "Não foi possível carregar o login com Google. Verifique sua conexão e tente novamente."
          );
        }}
      />
      <div className="relative mx-auto min-h-11 w-full max-w-[400px]">
        <div ref={containerRef} className="flex min-h-11 justify-center" />
        {!scriptReady && !scriptFailed ? (
          <div className="absolute inset-0 animate-pulse rounded-md border border-border bg-muted" />
        ) : null}
        {disabled ? (
          <div
            className="absolute inset-0 cursor-wait rounded-md bg-white/65"
            aria-hidden="true"
          />
        ) : null}
      </div>
    </div>
  );
}
