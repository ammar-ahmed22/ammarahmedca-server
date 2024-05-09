export const createQueryRegExp = (query: string) => {
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escapedQuery, "i");
};

export const containsQuery = (query: string, value: string) => {
  const regex = createQueryRegExp(query);
  return regex.test(value);
};
