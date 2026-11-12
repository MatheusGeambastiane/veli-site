"use client";

import styles from "@/shared/styles/veli-account.module.css";

import { useState, type FormEvent } from "react";
import { Pencil, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkoutService } from "@/features/checkout/services/checkout-service";
import type { HotsiteAuthenticatedUser, UpdateHotsiteUserPayload } from "@/shared/types";
import { accountError, isSessionExpired } from "./account-service";

const fields = [
  { key: "first_name", label: "Nome", autoComplete: "given-name", required: true },
  { key: "last_name", label: "Sobrenome", autoComplete: "family-name", required: true },
  { key: "cpf", label: "CPF", autoComplete: "off" },
  { key: "phone", label: "Telefone com DDD", autoComplete: "tel", type: "tel" },
  { key: "zip_code", label: "CEP", autoComplete: "postal-code" },
  { key: "address", label: "Rua", autoComplete: "address-line1" },
  { key: "address_number", label: "Número", autoComplete: "off" },
  { key: "province", label: "Bairro", autoComplete: "address-line2" },
  { key: "city", label: "Cidade", autoComplete: "address-level2" },
  { key: "state", label: "Estado (UF)", autoComplete: "address-level1" },
  { key: "country", label: "País", autoComplete: "country-name" },
] as const;

type ProfileFields = typeof fields[number]["key"];
type FormValues = Record<ProfileFields, string>;

function valuesFrom(user: HotsiteAuthenticatedUser): FormValues {
  return Object.fromEntries(fields.map(({ key }) => [key,
    key === "cpf" ? user.tax_id ?? "" : key === "zip_code" ? user.zip_code || user.cep || "" : user[key] ?? "",
  ])) as FormValues;
}

export function ProfilePanel({ user, onSaved, onSessionExpired }: {
  user: HotsiteAuthenticatedUser;
  onSaved: (user: HotsiteAuthenticatedUser) => void;
  onSessionExpired: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => valuesFrom(user));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const original = valuesFrom(user);
    const payload: Partial<UpdateHotsiteUserPayload> = {};
    for (const { key } of fields) {
      if (form[key].trim() !== original[key]) payload[key] = form[key].trim();
    }
    if (payload.zip_code !== undefined) payload.cep = payload.zip_code;
    setSaving(true);
    setError(null);
    try {
      const response = await checkoutService.updateCurrentUser(payload);
      onSaved(response.data);
      setForm(valuesFrom(response.data));
      setEditing(false);
      setSaved(true);
    } catch (failure) {
      if (isSessionExpired(failure)) onSessionExpired();
      else setError(accountError(failure));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={`${styles.panel} rounded-2xl border border-border bg-white p-5 sm:p-8`} aria-label="Perfil">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="font-heading text-xl font-semibold">Seu perfil</h2>
          <p className="mt-1 break-all text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-2 text-xs text-muted-foreground">Para alterar o e-mail de acesso, fale com o suporte.</p>
        </div>
        {!editing ? <Button variant="outline" className="h-10 px-4" onClick={() => {
          setForm(valuesFrom(user)); setEditing(true); setSaved(false); setError(null);
        }}><Pencil className="size-4" /> Editar dados</Button> : null}
      </div>
      {saved ? <p role="status" className="mt-5 flex items-center gap-2 text-sm text-emerald-800"><Check className="size-4" /> Seus dados foram atualizados.</p> : null}
      {error ? <p role="alert" className="mt-5 text-sm text-destructive">{error}</p> : null}
      {editing ? (
        <form onSubmit={save} className="mt-6">
          <fieldset disabled={saving} className="grid gap-5 sm:grid-cols-2">
            <legend className="sr-only">Editar dados pessoais e endereço</legend>
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <label htmlFor={`profile-${field.key}`} className="text-sm font-medium">{field.label}</label>
                <Input id={`profile-${field.key}`} name={field.key}
                  type={"type" in field ? field.type : "text"}
                  autoComplete={field.autoComplete}
                  required={"required" in field && field.required}
                  maxLength={field.key === "state" ? 2 : field.key === "cpf" ? 14 : 150}
                  value={form[field.key]} className="h-11"
                  onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} />
              </div>
            ))}
          </fieldset>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button type="submit" disabled={saving} className="h-11 px-6">{saving ? <Loader2 className="size-4 animate-spin" /> : null} Salvar alterações</Button>
            <Button type="button" variant="outline" disabled={saving} className="h-11 px-6" onClick={() => { setEditing(false); setError(null); }}>Cancelar</Button>
          </div>
        </form>
      ) : (
        <dl className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {fields.map(({ key, label }) => <div key={key}>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
            <dd className="mt-1 break-words text-sm text-foreground">{valuesFrom(user)[key] || "Não informado"}</dd>
          </div>)}
        </dl>
      )}
    </section>
  );
}
