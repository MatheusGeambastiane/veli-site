"use client";

import Script from "next/script";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

type TokenizeCustomer = { name: string; email: string; taxId: string };
type CheckoutInstance = {
  mount: (target: HTMLElement) => Promise<void> | void;
  tokenize: (customer: TokenizeCustomer) => Promise<{ token: string }>;
  destroy: () => void;
};

declare global {
  interface Window {
    AbacatePay?: {
      create: (options: {
        publicKey: string;
        amount: number;
        onCardChange: (state: { canTokenize: boolean }) => void;
      }) => CheckoutInstance;
    };
  }
}

export type AbacatePayCardFieldsRef = {
  tokenize: (customer: TokenizeCustomer) => Promise<string>;
};

type Props = {
  publicKey: string;
  amount: number;
  scriptUrl: string;
  onReadyChange?: (ready: boolean) => void;
};

export const AbacatePayCardFields = forwardRef<AbacatePayCardFieldsRef, Props>(
  function AbacatePayCardFields(
    { publicKey, amount, scriptUrl, onReadyChange },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const checkoutRef = useRef<CheckoutInstance | null>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
      if (
        !scriptLoaded ||
        !window.AbacatePay ||
        !containerRef.current ||
        !publicKey ||
        amount <= 0
      ) {
        return;
      }

      let disposed = false;
      let checkout: CheckoutInstance | null = null;
      const handleLoadError = () => {
        if (!disposed) {
          onReadyChange?.(false);
          setLoadError("Não foi possível carregar o formulário seguro. Recarregue a página para tentar novamente.");
        }
      };
      try {
        checkout = window.AbacatePay.create({
          publicKey,
          amount,
          onCardChange: ({ canTokenize }) => {
            if (!disposed) onReadyChange?.(canTokenize);
          },
        });
        checkoutRef.current = checkout;
        void Promise.resolve(checkout.mount(containerRef.current)).catch(handleLoadError);
      } catch {
        handleLoadError();
      }

      return () => {
        disposed = true;
        onReadyChange?.(false);
        checkout?.destroy();
        checkoutRef.current = null;
      };
    }, [amount, onReadyChange, publicKey, scriptLoaded]);

    useImperativeHandle(
      ref,
      () => ({
        async tokenize(customer) {
          if (!checkoutRef.current) {
            throw new Error("O formulário seguro do cartão ainda está carregando.");
          }
          const result = await checkoutRef.current.tokenize(customer);
          if (!result.token) {
            throw new Error("Não foi possível tokenizar o cartão.");
          }
          return result.token;
        },
      }),
      []
    );

    return (
      <>
        <Script
          src={scriptUrl}
          strategy="afterInteractive"
          onReady={() => setScriptLoaded(true)}
          onError={() => {
            onReadyChange?.(false);
            setLoadError("Não foi possível carregar o formulário seguro. Recarregue a página para tentar novamente.");
          }}
        />
        {loadError ? <p role="alert" className="text-sm text-destructive">{loadError}</p> : null}
        <div
          ref={containerRef}
          className="min-h-36 rounded-xl border border-border bg-white p-3"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Os dados do cartão são preenchidos e tokenizados diretamente pela
          AbacatePay.
        </p>
      </>
    );
  }
);
