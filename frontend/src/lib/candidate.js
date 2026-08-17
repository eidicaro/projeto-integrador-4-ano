const FALLBACK_JOB_IMAGE =
  "https://images.unsplash.com/photo-1515879218367-8466d910aaa4";

function hasOwn(value, key) {
  return Boolean(
    value && Object.prototype.hasOwnProperty.call(value, key),
  );
}

export function unwrapApiData(response) {
  const responseBody = response?.data;

  if (hasOwn(responseBody, "data")) {
    return responseBody.data;
  }

  return responseBody ?? null;
}

export function unwrapApiCollection(response) {
  const payload = unwrapApiData(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

export function extractAuthenticatedUser(response) {
  const payload = unwrapApiData(response);

  if (payload?.user) {
    return payload.user;
  }

  if (response?.data?.user) {
    return response.data.user;
  }

  return payload?.id ? payload : null;
}

export function getApplicationJobId(application) {
  return (
    application?.jobId ??
    application?.vagaId ??
    application?.vaga_id ??
    application?.job?.id ??
    application?.vaga?.id ??
    null
  );
}

export function normalizeJob(job) {
  const tags = [
    ...(Array.isArray(job?.tags) ? job.tags : []),
    job?.workMode,
    job?.employmentType,
    job?.seniority,
  ]
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter(Boolean)
    .filter(
      (tag, index, allTags) =>
        allTags.findIndex(
          (currentTag) =>
            currentTag.toLocaleLowerCase("pt-BR") ===
            tag.toLocaleLowerCase("pt-BR"),
        ) === index,
    );

  return {
    ...job,
    id: job?.id,
    title: job?.title || "Oportunidade sem título",
    description:
      job?.description || "Consulte os detalhes desta oportunidade.",
    image: job?.image || FALLBACK_JOB_IMAGE,
    category: job?.department || "Outras oportunidades",
    tags,
  };
}

export function getLaravelValidationErrors(error) {
  const errors = error?.response?.data?.errors;

  if (!errors || typeof errors !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages[0] || "" : String(messages),
    ]),
  );
}
