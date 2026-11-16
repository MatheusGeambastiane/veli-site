import type { HotsiteBillingOption } from "@/shared/types";

export function isCreditCardOption(option?: HotsiteBillingOption | null) {
  return Boolean(option && (option.billing_method === "credit_card" ||
    ["MONTHLY_CREDIT_CARD", "UPFRONT_CREDIT_CARD"].includes(option.code)));
}

export function getDefaultBillingOption(options: HotsiteBillingOption[]) {
  const active = options.filter((option) => option.is_active);
  return active.find((option) => isCreditCardOption(option) && option.type === "one_time")
    ?? active.find(isCreditCardOption)
    ?? active.find((option) => option.type === "one_time")
    ?? active[0]
    ?? null;
}

export function getPixSavings(option: HotsiteBillingOption | null, options: HotsiteBillingOption[]) {
  if (!option?.is_active || option.billing_method !== "pix") return null;

  const pixCents = Math.round(Number(option.price) * 100);
  if (!Number.isFinite(pixCents) || pixCents < 0) return null;

  const cardPrices = options
    .filter((candidate) => candidate.is_active && isCreditCardOption(candidate)
      && candidate.type === option.type && candidate.cycle === option.cycle)
    .map((candidate) => Math.round(Number(candidate.price) * 100))
    .filter((price) => Number.isFinite(price) && price > 0);
  if (!cardPrices.length) return null;

  const cardCents = Math.min(...cardPrices);
  const savingsCents = cardCents - pixCents;
  if (savingsCents <= 0) return null;

  return { amount: savingsCents / 100, percentage: savingsCents / cardCents * 100 };
}
