// removes unsupported firestore values
const sanitizeFirestoreData = (value) => {
  // if value is undefined, return undefined so it can be filtered out
  if (value === undefined) {
    return undefined;
  }

  // NULL is a valid Firestore value, so return it as is
  if (value === null) {
    return null;
  }

  // protect firestore sentinels
  // checks for serverTimestamp(), arrayUnion(), deleteField(), etc.
  // these are objects, but we must NOT strip them or recurse into them...
  if (value && typeof value === "object" && value._methodName) {
    return value;
  }

  //handle arrays recursively
  if (Array.isArray(value)) {
    //map over the array to sanitize items, then filter out any that became undefined
    return value.map(sanitizeFirestoreData).filter((v) => v !== undefined);
  }

  // handle objects recursively
  if (typeof value === "object") {
    // Dates also fall here but typically we want timestamps or ISO strings...
    // pass through any potential JS date objects
    if (value instanceof Date) return value;

    const sanitized = {};
    Object.keys(value).forEach((key) => {
      const sanitizedValue = sanitizeFirestoreData(value[key]);
      //only add the key if the value is valid
      if (sanitizedValue !== undefined) {
        sanitized[key] = sanitizedValue;
      }
    });
    return sanitized;
  }

  return value;
};

// converts an arXiv identifier or abstract URL into a direct PDF link
// ensures HTTPS is used and appends .pdf if needed
const getPdfUrl = (arxivIdUrl) => {
  if (typeof arxivIdUrl !== "string" || !arxivIdUrl) return "";
  let httpsUrl = arxivIdUrl;

  if (httpsUrl.startsWith("http://")) {
    httpsUrl = httpsUrl.replace("http://", "https://");
  }

  if (httpsUrl.includes("/abs/")) {
    httpsUrl = httpsUrl.replace("/abs/", "/pdf/");
  }

  if (!httpsUrl.endsWith(".pdf")) {
    httpsUrl += ".pdf";
  }

  return httpsUrl;
};

export { getPdfUrl, sanitizeFirestoreData };
