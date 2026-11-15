import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const code = ts.transpileModule(
  fs.readFileSync(new URL("../src/features/checkout/services/normalize-offers.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;
const context = { exports: {} };
vm.runInNewContext(code, context);
const { normalizeOffers } = context.exports;
const studentClass = (id, language = 2, level = "A1") => ({
  id, days_of_week: ["Mon"], time: "09:00:00",
  course: { language: { id: language, lang_icon: null }, levels: [{ level }] },
});
const offer = {
  id: 1, name: "Oferta", price: "1200.00",
  student_classes: [studentClass(1), studentClass(2, 2, "B1"), studentClass(3, 3)],
  billing_options: [{ billing_method: "credit_card", is_active: true }],
};

test("grouped responses need no extra request and preserve billing options", async () => {
  const results = await normalizeOffers([offer], () => assert.fail("Unexpected detail request"));
  assert.equal(results.length, 1);
  assert.equal(results[0].student_classes.length, 3);
  assert.equal(results[0].billing_options, offer.billing_options);
});

test("legacy class rows load each offer once and recover all classes and payments", async () => {
  const requests = [];
  const results = await normalizeOffers([{ id: 1, student_class_id: 1 }, { id: 1, student_class_id: 2 }], async (id) => {
    requests.push(id);
    return offer;
  });
  assert.deepEqual(requests, [1]);
  assert.equal(results.length, 1);
  assert.equal(results[0].student_classes.length, 3);
  assert.equal(results[0].billing_options[0].billing_method, "credit_card");
});

test("hydrated offers retain the selected language and placement level filters", async () => {
  const results = await normalizeOffers([{ id: 1 }], async () => offer, { languageId: "2", level: " b1 " });
  assert.equal(results.length, 1);
  assert.equal(results[0].student_classes.length, 1);
  assert.equal(results[0].student_classes[0].id, 2);
  assert.equal(offer.student_classes.length, 3);
});

test("offers without matching classes are omitted", async () => {
  const results = await normalizeOffers([offer], async () => offer, { level: "C2" });
  assert.equal(results.length, 0);
});

test("incomplete details fail during loading instead of crashing render", async () => {
  await assert.rejects(normalizeOffers([{ id: 1 }], async () => ({ id: 1 })), /detalhes da oferta/);
  await assert.rejects(normalizeOffers(undefined, async () => offer), /carregar as ofertas/);
});

test("detail request failures propagate to the checkout retry state", async () => {
  await assert.rejects(normalizeOffers([{ id: 1 }], async () => { throw new Error("Offline"); }), /Offline/);
});
