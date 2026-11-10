"use client";

import { FormEvent, useRef, useState } from "react";
import { Check, CreditCard, Loader2, LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  HotsiteAuthenticatedUser,
  HotsiteBillingOption,
  HotsiteStartCardPaymentPayload,
  PaymentGatewayConfig,
} from "@/shared/types";
import {
  AbacatePayCardFields,
  type AbacatePayCardFieldsRef,
} from "@/features/checkout/abacatepay-card-fields";

type CardField = "name" | "number" | "expiration" | "cvv" | null;

type CreditCardForm = {
  name: string;
  number: string;
  expirationDate: string;
  cvv: string;
};

type HolderForm = {
  name: string;
  phone: string;
  address: string;
  addressNumber: string;
  province: string;
  postalCode: string;
  city: string;
  state: string;
};

type CreditCardPaymentFormProps = {
  billingOption: HotsiteBillingOption;
  contractUrl?: string | null;
  loading: boolean;
  error: string | null;
  paymentConfig: PaymentGatewayConfig | null;
  customer: HotsiteAuthenticatedUser | null;
  amount: number;
  onSubmit: (payload: HotsiteStartCardPaymentPayload) => Promise<void>;
};

const initialCardForm: CreditCardForm = {
  name: "",
  number: "",
  expirationDate: "",
  cvv: "",
};

const initialHolderForm: HolderForm = {
  name: "",
  phone: "",
  address: "",
  addressNumber: "",
  province: "",
  postalCode: "",
  city: "",
  state: "",
};

function onlyDigits(value: string, limit: number) {
  return value.replace(/\D/g, "").slice(0, limit);
}

function formatCardNumber(value: string) {
  return onlyDigits(value, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiration(value: string, previousValue: string) {
  let digits = onlyDigits(value, 6);

  if (digits.length === 1 && Number(digits) > 1) {
    digits = `0${digits}`;
  }

  const monthDigits = digits.slice(0, 2);

  if (
    monthDigits.length === 2 &&
    (Number(monthDigits) < 1 || Number(monthDigits) > 12)
  ) {
    return previousValue;
  }

  const yearDigits = digits.slice(2);

  if (
    yearDigits.length === 4 &&
    Number(yearDigits) < new Date().getFullYear()
  ) {
    return previousValue;
  }

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatPhone(value: string) {
  return onlyDigits(value, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d)(\d{4})$/, "$1-$2");
}

function formatPostalCode(value: string) {
  return onlyDigits(value, 8).replace(/(\d{5})(\d)/, "$1-$2");
}

function isValidExpiration(value: string) {
  const match = value.match(/^(0[1-9]|1[0-2])\/(\d{4})$/);

  if (!match) {
    return false;
  }

  const month = Number(match[1]);
  const year = Number(match[2]);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  return year > currentYear || (year === currentYear && month >= currentMonth);
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function CreditCardPaymentForm({
  billingOption,
  contractUrl,
  loading,
  error,
  paymentConfig,
  customer,
  amount,
  onSubmit,
}: CreditCardPaymentFormProps) {
  const [card, setCard] = useState(initialCardForm);
  const [holder, setHolder] = useState(initialHolderForm);
  const [holderIsCustomer, setHolderIsCustomer] = useState(true);
  const [activeField, setActiveField] = useState<CardField>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [tokenizationReady, setTokenizationReady] = useState(false);
  const abacatePayRef = useRef<AbacatePayCardFieldsRef>(null);
  const usesAbacatePay = paymentConfig?.gateway === "abacatepay";
  const allowedInstallments = Array.from(
    new Set(
      billingOption.allowed_installments.filter(
        (installment) => Number.isInteger(installment) && installment > 0
      )
    )
  );
  const [installments, setInstallments] = useState(
    allowedInstallments[0] ?? 1
  );
  const isMonthly = billingOption.code === "MONTHLY_CREDIT_CARD";
  const cardDigits = onlyDigits(card.number, 19);
  const previewNumber = card.number || "•••• •••• •••• ••••";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);

    if (!usesAbacatePay && cardDigits.length < 13) {
      setValidationError("Informe um número de cartão válido.");
      return;
    }

    if (!usesAbacatePay && !isValidExpiration(card.expirationDate)) {
      setValidationError("Informe uma data de validade futura no formato MM/AAAA.");
      return;
    }

    if (!usesAbacatePay && card.cvv.length < 3) {
      setValidationError("Informe um CVV válido.");
      return;
    }

    if (!isMonthly && allowedInstallments.length === 0) {
      setValidationError(
        "Nenhuma quantidade de parcelas foi liberada para esta opção."
      );
      return;
    }

    if (
      !holderIsCustomer &&
      (onlyDigits(holder.phone, 11).length < 10 ||
        onlyDigits(holder.postalCode, 8).length !== 8)
    ) {
      setValidationError("Informe telefone e CEP válidos para o proprietário.");
      return;
    }

    const payload: HotsiteStartCardPaymentPayload = {
      accept_contract: true,
      holder_is_customer: holderIsCustomer,
    };

    if (usesAbacatePay) {
      if (!tokenizationReady || !paymentConfig?.public_key || !customer) {
        setValidationError("O formulário seguro do cartão ainda não está pronto.");
        return;
      }
      try {
        const token = await abacatePayRef.current?.tokenize({
          name: `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim(),
          email: customer.email ?? "",
          taxId: customer.tax_id ?? "",
        });
        if (!token) throw new Error("Não foi possível tokenizar o cartão.");
        payload.card_token = token;
      } catch (error) {
        setValidationError(
          error instanceof Error ? error.message : "Não foi possível validar o cartão."
        );
        return;
      }
      payload.holder_is_customer = true;
    } else {
      payload.credit_card = {
        name: card.name.trim().toUpperCase(),
        number: cardDigits,
        cvv: card.cvv,
        expiration_date: card.expirationDate,
      };
    }

    if (!isMonthly) {
      payload.installments = installments;
    }

    if (!holderIsCustomer) {
      payload.name = holder.name.trim();
      payload.phone = onlyDigits(holder.phone, 11);
      payload.address = holder.address.trim();
      payload.address_number = holder.addressNumber.trim();
      payload.province = holder.province.trim();
      payload.postal_code = onlyDigits(holder.postalCode, 8);
      payload.city = holder.city.trim();
      payload.state = holder.state.trim().toUpperCase();
    }

    await onSubmit(payload);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="[perspective:1200px]">
          <div
            className={`relative aspect-[1.586] w-full transition-transform duration-700 ease-out ${
              activeField ? "scale-[1.02]" : ""
            }`}
            style={{
              transformStyle: "preserve-3d",
              transform:
                activeField === "cvv" ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            <div
              className="absolute inset-0 overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#101b24] p-6 text-white shadow-xl"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="absolute -right-12 -top-16 size-48 rounded-full bg-primary/25 blur-2xl" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="h-9 w-12 rounded-md bg-gradient-to-br from-[#f0d88a] to-[#b9973f]" />
                  <CreditCard className="size-7 text-primary" />
                </div>
                <p
                  className={`font-mono text-lg tracking-[0.14em] transition ${
                    activeField === "number" ? "text-primary" : "text-white"
                  }`}
                >
                  {previewNumber}
                </p>
                <div className="flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[0.6rem] uppercase tracking-[0.2em] text-white/50">
                      Nome no cartão
                    </p>
                    <p
                      className={`mt-1 truncate text-sm font-semibold uppercase tracking-wide transition ${
                        activeField === "name" ? "text-primary" : "text-white"
                      }`}
                    >
                      {card.name || "SEU NOME"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[0.6rem] uppercase tracking-[0.2em] text-white/50">
                      Validade
                    </p>
                    <p
                      className={`mt-1 font-mono text-sm font-semibold transition ${
                        activeField === "expiration"
                          ? "text-primary"
                          : "text-white"
                      }`}
                    >
                      {card.expirationDate || "MM/AAAA"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="absolute inset-0 overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#101b24] py-6 text-white shadow-xl"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="mt-3 h-12 bg-black/70" />
              <div className="mx-6 mt-6 rounded-md bg-white p-3 text-right">
                <span className="font-mono text-sm font-bold tracking-[0.2em] text-[#101b24]">
                  {card.cvv || "•••"}
                </span>
              </div>
              <div className="mx-6 mt-5 flex items-center gap-2 text-xs text-white/60">
                <LockKeyhole className="size-4 text-primary" />
                Código de segurança
              </div>
            </div>
          </div>
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <LockKeyhole className="size-4 text-primary" />
          Seus dados são enviados diretamente para o processamento.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-[1.4rem] border border-border bg-white p-5 shadow-sm sm:p-6"
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Pagamento com cartão
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.03em] text-foreground">
            Insira os dados do cartão
          </h2>
        </div>

        {usesAbacatePay ? (
          paymentConfig?.public_key ? (
            <AbacatePayCardFields
              ref={abacatePayRef}
              publicKey={paymentConfig.public_key}
              amount={Math.round(amount * 100)}
              scriptUrl={paymentConfig.card_script_url ?? "https://abacatepay.com/abacatepay.js"}
              onReadyChange={setTokenizationReady}
            />
          ) : (
            <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              A chave pública da AbacatePay não está configurada.
            </p>
          )
        ) : (
        <div className="grid gap-4">
          <Field id="card-name" label="Nome impresso no cartão">
            <Input
              id="card-name"
              required
              minLength={3}
              maxLength={60}
              autoComplete="cc-name"
              value={card.name}
              onFocus={() => setActiveField("name")}
              onBlur={() => setActiveField(null)}
              onChange={(event) =>
                setCard((current) => ({
                  ...current,
                  name: event.target.value.toUpperCase(),
                }))
              }
              className="h-11 uppercase"
              placeholder="NOME COMPLETO"
            />
          </Field>

          <Field id="card-number" label="Número do cartão">
            <Input
              id="card-number"
              required
              inputMode="numeric"
              autoComplete="cc-number"
              maxLength={23}
              value={card.number}
              onFocus={() => setActiveField("number")}
              onBlur={() => setActiveField(null)}
              onChange={(event) =>
                setCard((current) => ({
                  ...current,
                  number: formatCardNumber(event.target.value),
                }))
              }
              className="h-11 font-mono tracking-wider"
              placeholder="0000 0000 0000 0000"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="card-expiration" label="Validade">
              <Input
                id="card-expiration"
                required
                inputMode="numeric"
                autoComplete="cc-exp"
                maxLength={7}
                value={card.expirationDate}
                onFocus={() => setActiveField("expiration")}
                onBlur={() => setActiveField(null)}
                onChange={(event) =>
                  setCard((current) => ({
                    ...current,
                    expirationDate: formatExpiration(
                      event.target.value,
                      current.expirationDate
                    ),
                  }))
                }
                className="h-11 font-mono"
                placeholder="MM/AAAA"
              />
            </Field>
            <Field id="card-cvv" label="CVV">
              <Input
                id="card-cvv"
                required
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                minLength={3}
                maxLength={4}
                value={card.cvv}
                onFocus={() => setActiveField("cvv")}
                onBlur={() => setActiveField(null)}
                onChange={(event) =>
                  setCard((current) => ({
                    ...current,
                    cvv: onlyDigits(event.target.value, 4),
                  }))
                }
                className="h-11 font-mono"
                placeholder="123"
              />
            </Field>
          </div>
        </div>
        )}

        {!isMonthly ? (
          <Field id="card-installments" label="Parcelas disponíveis">
            {allowedInstallments.length > 0 ? (
              <select
                id="card-installments"
                required
                value={installments}
                onChange={(event) => setInstallments(Number(event.target.value))}
                className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {allowedInstallments.map((installment) => (
                  <option key={installment} value={installment}>
                    {installment}x
                  </option>
                ))}
              </select>
            ) : (
              <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                Nenhuma quantidade de parcelas foi aprovada para esta opção.
              </p>
            )}
          </Field>
        ) : null}

        {!usesAbacatePay ? <button
          type="button"
          role="checkbox"
          aria-checked={holderIsCustomer}
          onClick={() => setHolderIsCustomer((current) => !current)}
          className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/30 p-4 text-left transition hover:border-primary/40 hover:bg-accent"
        >
          <span
            className={`flex size-5 shrink-0 items-center justify-center rounded border transition ${
              holderIsCustomer
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-white"
            }`}
          >
            {holderIsCustomer ? <Check className="size-3.5" /> : null}
          </span>
          <span className="text-sm font-semibold text-foreground">
            Os dados do proprietário são os mesmos que o meu
          </span>
        </button> : null}

        {!usesAbacatePay && !holderIsCustomer ? (
          <div className="animate-in fade-in slide-in-from-top-2 space-y-4 rounded-[1.2rem] border border-border bg-muted/20 p-4 duration-300">
            <h3 className="font-heading text-xl font-semibold text-foreground">
              Dados do proprietário
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field id="holder-name" label="Nome completo">
                  <Input
                    id="holder-name"
                    required
                    autoComplete="name"
                    value={holder.name}
                    onChange={(event) =>
                      setHolder((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="h-11"
                  />
                </Field>
              </div>
              <Field id="holder-phone" label="Telefone">
                <Input
                  id="holder-phone"
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={15}
                  value={holder.phone}
                  onChange={(event) =>
                    setHolder((current) => ({
                      ...current,
                      phone: formatPhone(event.target.value),
                    }))
                  }
                  className="h-11"
                  placeholder="(00) 00000-0000"
                />
              </Field>
              <Field id="holder-postal-code" label="CEP">
                <Input
                  id="holder-postal-code"
                  required
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={9}
                  value={holder.postalCode}
                  onChange={(event) =>
                    setHolder((current) => ({
                      ...current,
                      postalCode: formatPostalCode(event.target.value),
                    }))
                  }
                  className="h-11"
                  placeholder="00000-000"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field id="holder-address" label="Endereço">
                  <Input
                    id="holder-address"
                    required
                    autoComplete="street-address"
                    value={holder.address}
                    onChange={(event) =>
                      setHolder((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    className="h-11"
                  />
                </Field>
              </div>
              <Field id="holder-address-number" label="Número">
                <Input
                  id="holder-address-number"
                  required
                  value={holder.addressNumber}
                  onChange={(event) =>
                    setHolder((current) => ({
                      ...current,
                      addressNumber: event.target.value,
                    }))
                  }
                  className="h-11"
                />
              </Field>
              <Field id="holder-province" label="Bairro">
                <Input
                  id="holder-province"
                  required
                  value={holder.province}
                  onChange={(event) =>
                    setHolder((current) => ({
                      ...current,
                      province: event.target.value,
                    }))
                  }
                  className="h-11"
                />
              </Field>
              <Field id="holder-city" label="Cidade">
                <Input
                  id="holder-city"
                  required
                  autoComplete="address-level2"
                  value={holder.city}
                  onChange={(event) =>
                    setHolder((current) => ({
                      ...current,
                      city: event.target.value,
                    }))
                  }
                  className="h-11"
                />
              </Field>
              <Field id="holder-state" label="Estado">
                <Input
                  id="holder-state"
                  required
                  autoComplete="address-level1"
                  minLength={2}
                  maxLength={2}
                  value={holder.state}
                  onChange={(event) =>
                    setHolder((current) => ({
                      ...current,
                      state: event.target.value
                        .replace(/[^A-Za-z]/g, "")
                        .slice(0, 2)
                        .toUpperCase(),
                    }))
                  }
                  className="h-11 uppercase"
                  placeholder="BA"
                />
              </Field>
            </div>
          </div>
        ) : null}

        {validationError || error ? (
          <p
            className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
            role="alert"
          >
            {validationError ?? error}
          </p>
        ) : null}

        <p className="text-center text-xs leading-5 text-muted-foreground">
          Ao prosseguir, concordo com o{" "}
          {contractUrl ? (
            <a
              href={contractUrl}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-foreground underline underline-offset-4 transition hover:text-primary"
            >
              termo de adesão
            </a>
          ) : (
            <span className="font-semibold text-foreground underline underline-offset-4">
              termo de adesão
            </span>
          )}
          .
        </p>

        <Button
          type="submit"
          className="h-12 w-full rounded-xl"
          disabled={
            loading || (!isMonthly && allowedInstallments.length === 0)
          }
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Pagar com cartão
        </Button>
      </form>
    </div>
  );
}
