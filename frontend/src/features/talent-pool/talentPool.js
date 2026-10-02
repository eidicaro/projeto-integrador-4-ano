/** Frontend contract. Membership is independent from applications and resumes.
 * @typedef {{userId: string, interests: string[], joinedAt: string, updatedAt: string}} TalentMembership
 * @typedef {{id: string, name: string, email: string, phone: string, location: string,
 * interests: string[], skills: string[], resume: object, joinedAt: string, updatedAt: string,
 * source: 'demo'}} Talent
 */

export function normalizeSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function uniqueInterests(values) {
  const seen = new Set();
  return values
    .map((value) => String(value).trim())
    .filter((value) => {
      const key = normalizeSearch(value);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function validateInterests(interests) {
  if (!interests.length) return "Selecione pelo menos uma área de interesse.";
  if (interests.length > 8)
    return "Escolha até oito áreas para manter seus interesses objetivos.";
  if (interests.some((value) => value.length < 2 || value.length > 120))
    return "Cada área deve ter entre 2 e 120 caracteres.";
  return "";
}

export function interestOptions(jobs, resume, membership) {
  return uniqueInterests(
    [
      ...jobs.map((job) => job.department).filter(Boolean),
      resume?.area_atuacao,
      ...(membership?.interests || []),
    ].filter(Boolean),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function profileCompleteness(resume, user = {}) {
  const checks = [
    ["Nome", resume?.nome_completo || user.name],
    ["E-mail", resume?.email || user.email],
    ["Telefone", resume?.telefone || user.telefone],
    ["Localização", resume?.cidade_estado],
    ["Área de atuação", resume?.area_atuacao],
    ["Apresentação", resume?.resumo],
    ["Habilidades", resume?.habilidades?.length],
    [
      "Experiência ou formação",
      resume?.experiencias?.length || resume?.formacoes?.length,
    ],
  ];
  return {
    percent: Math.round(
      (checks.filter(([, value]) => Boolean(value)).length / checks.length) *
        100,
    ),
    missing: checks.filter(([, value]) => !value).map(([label]) => label),
  };
}

export function filterTalents(
  talents,
  { query = "", area = "", location = "", period = "", sort = "recent" },
  now = Date.now(),
) {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  const cutoff = period ? now - Number(period) * 86400000 : null;
  const result = talents.filter((talent) => {
    const searchable = normalizeSearch(
      [
        talent.name,
        talent.resume?.area_atuacao,
        talent.location,
        ...talent.interests,
        ...talent.skills,
        ...(talent.resume?.experiencias || []).map((entry) => entry.cargo),
      ].join(" "),
    );
    return (
      words.every((word) => searchable.includes(word)) &&
      (!area || talent.interests.includes(area)) &&
      (!location || talent.location === location) &&
      (!cutoff || new Date(talent.joinedAt).getTime() >= cutoff)
    );
  });
  return result.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name, "pt-BR");
    if (sort === "complete")
      return (
        profileCompleteness(b.resume).percent -
          profileCompleteness(a.resume).percent ||
        a.name.localeCompare(b.name, "pt-BR")
      );
    return (
      (sort === "oldest" ? 1 : -1) *
      (new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime())
    );
  });
}

export function formatTalentDate(value) {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date)
    : "Não informada";
}

export function initials(name) {
  return String(name || "Talento")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
