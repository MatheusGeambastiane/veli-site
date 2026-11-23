import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const code = ts.transpileModule(
  fs.readFileSync(new URL("../src/features/checkout/services/placement-offer-fallback.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;
const context = { exports: {} };
vm.runInNewContext(code, context);
const { findPlacementOffersWithFallback } = context.exports;

test("keeps the exact placement level when classes are available", async () => {
  const requestedLevels = [];
  const exactOffer = { id: 1 };
  const result = await findPlacementOffersWithFallback("C1", async (level) => {
    requestedLevels.push(level);
    return level === "C1" ? [exactOffer] : [];
  });

  assert.deepEqual(requestedLevels, ["C1"]);
  assert.equal(result.matchedLevel, "C1");
  assert.equal(result.offers[0], exactOffer);
});

test("selects the nearest lower level when the placement level has no classes", async () => {
  const requestedLevels = [];
  const fallbackOffer = { id: 2 };
  const result = await findPlacementOffersWithFallback("C1", async (level) => {
    requestedLevels.push(level);
    return level === "B2" ? [fallbackOffer] : [];
  });

  assert.deepEqual(requestedLevels, ["C1", "B2"]);
  assert.equal(result.matchedLevel, "B2");
  assert.equal(result.offers[0], fallbackOffer);
});

test("continues downward without ever recommending a higher level", async () => {
  const requestedLevels = [];
  const result = await findPlacementOffersWithFallback("B2", async (level) => {
    requestedLevels.push(level);
    return level === "A2" ? [{ id: 3 }] : [];
  });

  assert.deepEqual(requestedLevels, ["B2", "B1", "A2"]);
  assert.equal(result.matchedLevel, "A2");
});

test("returns no match after exhausting all lower levels", async () => {
  const requestedLevels = [];
  const result = await findPlacementOffersWithFallback("A2", async (level) => {
    requestedLevels.push(level);
    return [];
  });

  assert.deepEqual(requestedLevels, ["A2", "A1"]);
  assert.equal(result.offers.length, 0);
  assert.equal(result.matchedLevel, null);
});
