export const createQueryString = (params: object): string => {
  const result = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        result.append(key, value.join(','));
      } else {
        result.set(key, value);
      }
    }
  }

  return result.toString() ? `?${result.toString()}` : '';
};
