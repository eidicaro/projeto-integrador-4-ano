import { unwrapApiData } from "../../lib/candidate.js";
import { readPaginatedResponse } from "../../lib/pagination.js";

export const CONSENT_VERSION = "v1";

export function normalizeMembership(value) {
  if (!value) return null;
  return { ...value, id: String(value.id), userId: String(value.userId) };
}

export function normalizeTalent(value) {
  return { ...normalizeMembership(value), source: "api" };
}

export function createTalentPoolApi(client) {
  return {
    async getMembership(signal) {
      return normalizeMembership(unwrapApiData(await client.get("/banco-de-talentos/me", { signal })));
    },
    async saveMembership(interests, joining) {
      const data = { interests };
      if (joining) {
        data.consentAccepted = true;
        data.consentVersion = CONSENT_VERSION;
      }
      return normalizeMembership(unwrapApiData(await client.put("/banco-de-talentos/me", data)));
    },
    async leaveMembership() {
      await client.delete("/banco-de-talentos/me");
    },
    async list(params, signal) {
      const response = await client.get("/admin/banco-de-talentos", { params, signal });
      const pagination = readPaginatedResponse(response);
      return {
        ...pagination,
        items: pagination.items.map(normalizeTalent),
        summary: response.data.summary,
        facets: response.data.facets,
      };
    },
    async detail(id, signal) {
      return normalizeTalent(unwrapApiData(await client.get(
        "/admin/banco-de-talentos/" + encodeURIComponent(id), { signal },
      )));
    },
    async refer(id, jobId) {
      return unwrapApiData(await client.post(
        "/admin/banco-de-talentos/" + encodeURIComponent(id) + "/indicacoes",
        { vaga_id: Number(jobId) },
      ));
    },
  };
}
