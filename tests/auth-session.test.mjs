import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));

function loadRoute(route, { access = "test-access", status = 200, offline = false } = {}) {
  const deleted = [];
  const requests = [];
  const cookieStore = {
    get: () => access ? { value: access } : undefined,
    delete: (name) => deleted.push(name),
  };
  const code = ts.transpileModule(
    fs.readFileSync(path.join(testDirectory, "..", "src/app/api", route, "route.ts"), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }
  ).outputText;
  const context = {
    exports: {}, Response, Headers, AbortSignal, Buffer, process: { env: {} },
    require(name) {
      if (name === "next/headers") return { cookies: async () => cookieStore };
      if (name === "@/shared/lib/backend-url") return { getBackendUrl: () => "https://backend.test" };
      throw new Error(`Unexpected import: ${name}`);
    },
    async fetch(url, options) {
      requests.push({ url, options });
      if (offline) throw new Error("Backend unavailable");
      return Response.json({}, { status });
    },
  };
  vm.runInNewContext(code, context);
  return { route: context.exports, deleted, requests };
}

test("missing cookie is unauthenticated without calling the backend", async () => {
  const state = loadRoute("auth/session", { access: null });
  const response = await state.route.GET();
  assert.deepEqual(await response.json(), { authenticated: false });
  assert.equal(state.requests.length, 0);
});

test("existing cookie must be accepted by the backend", async () => {
  const state = loadRoute("auth/session");
  const response = await state.route.GET();
  assert.deepEqual(await response.json(), { authenticated: true });
  assert.equal(state.requests[0].url, "https://backend.test/hotsite/users/me/");
  assert.equal(state.requests[0].options.headers.Authorization, "Bearer test-access");
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(state.deleted, []);
});

test("rejected session clears both cookies and stops login redirects", async () => {
  const state = loadRoute("auth/session", { status: 401 });
  const response = await state.route.GET();
  assert.deepEqual(await response.json(), { authenticated: false });
  assert.deepEqual(state.deleted, ["veli_access_token", "veli_refresh_token"]);
});

for (const options of [{ status: 503 }, { status: 403 }, { offline: true }]) {
  test(`backend failure preserves cookies: ${JSON.stringify(options)}`, async () => {
    const state = loadRoute("auth/session", options);
    const response = await state.route.GET();
    assert.equal(response.status, 502);
    assert.deepEqual(state.deleted, []);
  });
}

for (const explicitAuthorization of [false, true]) {
  test(`proxy 401 only clears the rejected cookie session (explicit authorization: ${explicitAuthorization})`, async () => {
    const state = loadRoute("backend/[...path]", { status: 401 });
    const headers = new Headers({ "X-Veli-Requires-Auth": "1" });
    if (explicitAuthorization) headers.set("Authorization", "Bearer separate-test-access");
    const response = await state.route.GET({
      method: "GET", headers,
      nextUrl: new URL("https://site.test/api/backend/hotsite/orders/?page=1"),
    });
    assert.equal(response.status, 401);
    assert.deepEqual(state.deleted, explicitAuthorization ? [] : ["veli_access_token", "veli_refresh_token"]);
  });
}
