import test from "node:test";
import assert from "node:assert/strict";
import { createTalentPoolApi, CONSENT_VERSION } from "../src/features/talent-pool/apiRepository.js";

const membership = { id: 42, userId: 7, interests: ["Tecnologia"], joinedAt: "2026-10-06T10:00:00Z", updatedAt: "2026-10-06T10:00:00Z" };

test("official joining sends current consent and trusts server IDs and dates", async () => {
  let payload;
  const service = createTalentPoolApi({
    put: async (url, data) => {
      assert.equal(url, "/banco-de-talentos/me");
      payload = data;
      return { data: { data: membership } };
    },
  });
  const result = await service.saveMembership(["Tecnologia"], true);
  assert.deepEqual(payload, { interests: ["Tecnologia"], consentAccepted: true, consentVersion: CONSENT_VERSION });
  assert.equal(result.id, "42");
  assert.equal(result.userId, "7");
  assert.equal(result.joinedAt, membership.joinedAt);
  await service.saveMembership(["Tecnologia"], false);
  assert.deepEqual(payload, { interests: ["Tecnologia"] });
});

test("membership reads null and deletion awaits server confirmation or failure", async () => {
  const signal = new AbortController().signal;
  const service = createTalentPoolApi({
    get: async (url, config) => {
      assert.equal(url, "/banco-de-talentos/me");
      assert.equal(config.signal, signal);
      return { data: { data: null } };
    },
    delete: async (url) => {
      assert.equal(url, "/banco-de-talentos/me");
      throw new Error("network failed");
    },
  });
  assert.equal(await service.getMembership(signal), null);
  await assert.rejects(service.leaveMembership(), /network failed/);
});

test("admin list preserves server totals and facets independently of the loaded page", async () => {
  const params = { q: "react sao", area: "Tecnologia", page: 2, per_page: 12, sort: "complete" };
  const service = createTalentPoolApi({
    get: async (url, config) => {
      assert.equal(url, "/admin/banco-de-talentos");
      assert.deepEqual(config.params, params);
      return { data: {
        data: [{ ...membership, name: "Maria", resume: null }],
        meta: { current_page: 2, last_page: 3, total: 25 },
        links: { next: "/page/3" },
        summary: { total: 150, newLast30Days: 20, areas: 3 },
        facets: { areas: ["Tecnologia", "Design"], locations: ["São Paulo"] },
      } };
    },
  });
  const result = await service.list(params);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].source, "api");
  assert.equal(result.total, 25);
  assert.equal(result.currentPage, 2);
  assert.equal(result.lastPage, 3);
  assert.equal(result.summary.total, 150);
  assert.equal(result.facets.areas.length, 2);
});

test("details use membership ID and referrals preserve real application or reject server errors", async () => {
  const failure = { response: { status: 409, data: { message: "Candidatura duplicada" } } };
  let shouldFail = false;
  const service = createTalentPoolApi({
    get: async (url) => {
      assert.equal(url, "/admin/banco-de-talentos/42");
      return { data: { data: { ...membership, resume: null } } };
    },
    post: async (url, payload) => {
      assert.equal(url, "/admin/banco-de-talentos/42/indicacoes");
      assert.deepEqual(payload, { vaga_id: 15 });
      if (shouldFail) throw failure;
      return { data: { data: { id: 90, userId: 7, source: "banco_de_talentos" } } };
    },
  });
  assert.equal((await service.detail("42")).resume, null);
  assert.equal((await service.refer("42", "15")).userId, 7);
  shouldFail = true;
  await assert.rejects(service.refer("42", "15"), (error) => error === failure);
});
