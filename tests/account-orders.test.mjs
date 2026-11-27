import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const code = ts.transpileModule(
  fs.readFileSync(new URL("../src/features/account/account-service.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;
const context = {
  exports: {},
  require(name) {
    if (name === "@/shared/lib/http-client") return { httpClient: {} };
    throw new Error(`Unexpected import: ${name}`);
  },
};
vm.runInNewContext(code, context);
const { isSubscriptionOrder } = context.exports;

const order = (paymentMode) => ({ payment_mode: paymentMode });

test("monthly and recurring orders are classified as subscriptions", () => {
  for (const paymentMode of ["monthly", "recurring", "subscription", " Monthly "]) {
    assert.equal(isSubscriptionOrder(order(paymentMode)), true);
  }
});

test("one-time and installment orders are classified as full payment", () => {
  for (const paymentMode of ["one_time", "upfront", "installments", "", null]) {
    assert.equal(isSubscriptionOrder(order(paymentMode)), false);
  }
});
