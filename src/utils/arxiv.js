export const extractArxivId = (input) => {
  if (!input) return null;
  const str = String(input);

  const idMatch = str.match(/(\d{4}\.\d{4,5}|[a-z\-]+(\.[A-Z]{2})?\/\d{7})/);

  return idMatch ? idMatch[0] : str;
};

export const buildProxiedUrl = (url, { enabled, proxyBase }) => {
  if (!url) return url;
  if (!enabled) return url;
  return `${proxyBase}${encodeURIComponent(url)}`;
};
