"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkoutService } from "@/features/checkout/services/checkout-service";
import type {
  HotsiteAuthenticatedUser,
  UpdateHotsiteUserPayload,
} from "@/shared/types";

const stateOptions = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

type ProfileForm = {
  firstName: string;
  lastName: string;
  cpf: string;
  phone: string;
  cep: string;
  address: string;
  addressNumber: string;
  province: string;
  city: string;
  state: string;
  country: string;
};

type ProfileCompletionFormProps = {
  user: HotsiteAuthenticatedUser;
  submitting: boolean;
  error: string | null;
  submitLabel?: string;
  description?: string;
  onSubmit: (payload: UpdateHotsiteUserPayload) => void | Promise<void>;
};

function formatCpf(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function getLocalPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("55") && digits.length > 11
    ? digits.slice(2)
    : digits;
}

function formatPhone(value: string) {
  return getLocalPhone(value)
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d)(\d{4})$/, "$1-$2");
}

function formatCep(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function getInitialForm(user: HotsiteAuthenticatedUser): ProfileForm {
  return {
    firstName: user.first_name ?? "",
    lastName: user.last_name ?? "",
    cpf: formatCpf(user.tax_id ?? ""),
    phone: formatPhone(user.phone ?? ""),
    cep: formatCep(user.cep ?? user.zip_code ?? ""),
    address: user.address ?? "",
    addressNumber: user.address_number ?? "",
    province: user.province ?? "",
    city: user.city ?? "",
    state: user.state ?? "",
    country: user.country || "Brasil",
  };
}

export function ProfileCompletionForm({
  user,
  submitting,
  error,
  submitLabel = "Salvar perfil e criar pedido",
  description = "Precisamos destes dados para concluir sua matrícula e criar o pedido.",
  onSubmit,
}: ProfileCompletionFormProps) {
  const [form, setForm] = useState(() => getInitialForm(user));
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const handleCepBlur = async () => {
    const cep = form.cep.replace(/\D/g, "");

    if (cep.length !== 8) {
      return;
    }

    setCepLoading(true);
    setCepError(null);

    try {
      const data = await checkoutService.lookupCep(cep);
      setForm((current) => ({
        ...current,
        address: data.logradouro || current.address,
        province: data.bairro || current.province,
        city: data.localidade || current.city,
        state: data.uf || current.state,
      }));
    } catch {
      setCepError("Não foi possível consultar esse CEP. Preencha o endereço manualmente.");
    } finally {
      setCepLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cpf = form.cpf.replace(/\D/g, "");
    const phone = getLocalPhone(form.phone);
    const cep = form.cep.replace(/\D/g, "");

    void onSubmit({
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      cpf,
      phone: `+55${phone}`,
      cep,
      zip_code: cep,
      address: form.address.trim(),
      address_number: form.addressNumber.trim(),
      province: form.province.trim(),
      city: form.city.trim(),
      state: form.state,
      country: form.country.trim(),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-[1.4rem] border border-border bg-white p-5 shadow-sm"
    >
      <div>
        <p className="font-heading text-2xl font-semibold text-foreground">
          Complete seu perfil
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      {user.linked_existing_user ? (
        <p className="flex items-start gap-2 rounded-xl border border-emerald-600/20 bg-emerald-600/5 p-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          Sua conta existente foi vinculada ao Google com sucesso.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <fieldset disabled={submitting} className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome">
          <Input
            required
            autoComplete="given-name"
            value={form.firstName}
            onChange={(event) =>
              setForm((current) => ({ ...current, firstName: event.target.value }))
            }
            className="h-11"
          />
        </Field>
        <Field label="Sobrenome">
          <Input
            required
            autoComplete="family-name"
            value={form.lastName}
            onChange={(event) =>
              setForm((current) => ({ ...current, lastName: event.target.value }))
            }
            className="h-11"
          />
        </Field>
        <Field label="CPF">
          <Input
            required
            inputMode="numeric"
            maxLength={14}
            pattern="\d{3}\.\d{3}\.\d{3}-\d{2}"
            title="Digite os 11 números do CPF"
            placeholder="000.000.000-00"
            value={form.cpf}
            onChange={(event) =>
              setForm((current) => ({ ...current, cpf: formatCpf(event.target.value) }))
            }
            className="h-11"
          />
        </Field>
        <Field label="Telefone">
          <Input
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={15}
            pattern="\(\d{2}\) \d{4,5}-\d{4}"
            title="Digite o telefone com DDD"
            placeholder="(00) 00000-0000"
            value={form.phone}
            onChange={(event) =>
              setForm((current) => ({ ...current, phone: formatPhone(event.target.value) }))
            }
            className="h-11"
          />
        </Field>
        <Field label="CEP">
          <div className="relative">
            <Input
              required
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={9}
              pattern="\d{5}-\d{3}"
              placeholder="00000-000"
              value={form.cep}
              onBlur={handleCepBlur}
              onChange={(event) =>
                setForm((current) => ({ ...current, cep: formatCep(event.target.value) }))
              }
              className="h-11 pr-10"
            />
            {cepLoading ? (
              <Loader2 className="absolute right-3 top-3 size-5 animate-spin text-primary" />
            ) : null}
          </div>
          {cepError ? <p className="text-xs text-destructive">{cepError}</p> : null}
        </Field>
        <Field label="Rua">
          <Input
            required
            autoComplete="address-line1"
            value={form.address}
            onChange={(event) =>
              setForm((current) => ({ ...current, address: event.target.value }))
            }
            className="h-11"
          />
        </Field>
        <Field label="Número">
          <Input
            required
            value={form.addressNumber}
            onChange={(event) =>
              setForm((current) => ({ ...current, addressNumber: event.target.value }))
            }
            className="h-11"
          />
        </Field>
        <Field label="Bairro">
          <Input
            required
            autoComplete="address-line2"
            value={form.province}
            onChange={(event) =>
              setForm((current) => ({ ...current, province: event.target.value }))
            }
            className="h-11"
          />
        </Field>
        <Field label="Cidade">
          <Input
            required
            autoComplete="address-level2"
            value={form.city}
            onChange={(event) =>
              setForm((current) => ({ ...current, city: event.target.value }))
            }
            className="h-11"
          />
        </Field>
        <Field label="Estado">
          <select
            required
            autoComplete="address-level1"
            value={form.state}
            onChange={(event) =>
              setForm((current) => ({ ...current, state: event.target.value }))
            }
            className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="" disabled>
              Selecione
            </option>
            {stateOptions.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </Field>
        <Field label="País">
          <Input
            required
            autoComplete="country-name"
            value={form.country}
            onChange={(event) =>
              setForm((current) => ({ ...current, country: event.target.value }))
            }
            className="h-11"
          />
        </Field>
      </fieldset>

      <Button
        type="submit"
        className="h-12 w-full rounded-xl"
        disabled={submitting || cepLoading}
      >
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
