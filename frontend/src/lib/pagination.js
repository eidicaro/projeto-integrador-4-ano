function toPositiveInteger(value, fallback) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function readPaginatedResponse(response) {
  const payload = response?.data || {};
  const items = Array.isArray(payload?.data) ? payload.data : [];
  const meta = payload?.meta || {};
  const currentPage = toPositiveInteger(meta.current_page, 1);
  const lastPage = toPositiveInteger(meta.last_page, currentPage);
  const parsedTotal = Number(meta.total);

  return {
    items,
    currentPage,
    lastPage,
    total:
      Number.isFinite(parsedTotal) && parsedTotal >= 0
        ? parsedTotal
        : items.length,
    hasMore:
      Boolean(payload?.links?.next) || currentPage < lastPage,
  };
}

export function mergeUniqueById(currentItems, incomingItems) {
  const merged = new Map();

  [...currentItems, ...incomingItems].forEach((item) => {
    const key = item?.id;

    if (key === null || key === undefined) return;
    merged.set(String(key), item);
  });

  return Array.from(merged.values());
}

export async function collectPaginatedItems(
  requestPage,
  { maxPages = 1000 } = {},
) {
  const collected = [];
  let requestedPage = 1;

  for (let index = 0; index < maxPages; index += 1) {
    const response = await requestPage(requestedPage);
    const page = readPaginatedResponse(response);

    collected.push(...page.items);

    if (!page.hasMore) {
      return collected;
    }

    const nextPage = Math.max(requestedPage + 1, page.currentPage + 1);

    if (nextPage <= requestedPage) break;
    requestedPage = nextPage;
  }

  throw new Error(
    "A API retornou uma paginação inválida ou extensa demais.",
  );
}
