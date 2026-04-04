export function getPaginationParams(req, defaultLimit = 10, maxLimit = 100) {
  let page = parseInt(req.query.page || "1", 10);
  let limit = parseInt(req.query.limit || `${defaultLimit}`, 10);

  // Safety checks
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  const start = (page - 1) * limit;
  const end = start + limit;

  return { page, limit, start, end };
}

export function buildPaginationMeta(totalItems, page, limit) {
  const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

  return {
    totalItems,
    totalPages,
    currentPage: page,
    pageSize: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null,
  };
}
