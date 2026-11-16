import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(
  fs.readFileSync(new URL("../src/features/checkout/billing-options.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText, context);
const { getDefaultBillingOption, getPixSavings } = context.exports;
const card = { code: "UPFRONT_CREDIT_CARD", billing_method: "credit_card", type: "one_time", cycle: "none", price: "1200.00", is_active: true };
const pix = { ...card, code: "UPFRONT_PIX", billing_method: "pix", price: "1140.00" };

test("credit card is the default regardless of response order, with a Pix-only fallback", () => {
  assert.equal(getDefaultBillingOption([pix, card]), card);
  assert.equal(getDefaultBillingOption([pix, { ...card, is_active: false }]), pix);
  const monthly = { ...card, type: "recurring", cycle: "monthly" };
  assert.equal(getDefaultBillingOption([pix, monthly]), monthly);
  assert.equal(getDefaultBillingOption([]), null);
});

test("Pix savings use the card total and do not discount the backend price again", () => {
  const savings = getPixSavings(pix, [card, pix]);
  assert.equal(savings.amount, 60);
  assert.equal(savings.percentage, 5);
  assert.equal(pix.price, "1140.00");
  assert.equal(getPixSavings(card, [card, pix]), null);
});

test("only comparable active card prices produce savings", () => {
  for (const alternative of [
    { ...card, type: "recurring" }, { ...card, cycle: "monthly" },
    { ...card, is_active: false }, { ...card, price: "invalid" },
    { ...card, price: "0" }, { ...card, price: pix.price },
    { ...card, price: "1100.00" },
  ]) assert.equal(getPixSavings(pix, [alternative]), null);
  assert.equal(getPixSavings(pix, []), null);
});

test("currency calculations preserve cents and use the lowest comparable card price", () => {
  assert.equal(getPixSavings({ ...pix, price: "0.10" }, [{ ...card, price: "0.30" }]).amount, 0.2);
  assert.equal(getPixSavings(pix, [card, { ...card, price: "1160.00" }]).amount, 20);
});
