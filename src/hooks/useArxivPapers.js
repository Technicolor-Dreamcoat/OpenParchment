import { useCallback, useState } from "react";
import { Platform } from "react-native";
import { XMLParser } from "fast-xml-parser";
import { API_ENDPOINTS, FEATURE_FLAGS } from "../config/apiConfig";
import { RESULTS_PER_PAGE } from "../config/searchAndSortConfig";
import { buildProxiedUrl } from "../utils/arxiv";
import { triggerHaptic } from "../utils/haptics";
import { getPdfUrl } from "../navigation/utils/paperUtils";

const BASE_ARXIV_URL = API_ENDPOINTS.arxiv;
const proxyConfig = {
  enabled: FEATURE_FLAGS.useCorsProxy,
  proxyBase: API_ENDPOINTS.corsProxyBase,
};

const isWeb = Platform.OS === "web";

export const useArxivPapers = ({ sortBy, sortOrder }) => {
  // track the list of papers and request states
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchPapers = useCallback(
    async (
      query,
      isSearch = false,
      loadMore = false,
      currentCount = 0,
      sortByValue = sortBy,
      sortOrderValue = sortOrder
    ) => {
      //use any passed sort values else fall back to hook props
      const sortField = sortByValue ?? sortBy;
      const sortDirection = sortOrderValue ?? sortOrder;

      // distinguish betw initial load & pagination for UI feedback
      if (loadMore) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const start = loadMore ? currentCount : 0;

        // build the arXiv search parameter depending on whether the query is advanced search
        let searchParam;
        if (isSearch) {
          const cleanQuery = query.trim();

          const isAdvanced =
            cleanQuery.includes("ti:") ||
            cleanQuery.includes("au:") ||
            cleanQuery.includes("abs:") ||
            cleanQuery.includes("jr:") ||
            cleanQuery.includes("id:");

          if (isAdvanced) {
            searchParam = cleanQuery;
          } else {
            const hasSpaces = cleanQuery.includes(" ");
            const hasQuotes = cleanQuery.includes('"');
            const hasBoolean =
              cleanQuery.includes("AND") || cleanQuery.includes("OR");

            if (hasSpaces && !hasQuotes && !hasBoolean) {
              searchParam = `all:"${cleanQuery}"`;
            } else {
              searchParam = `all:${cleanQuery}`;
            }
          }
        } else {
          searchParam = query;
        }

        // construct the URL... proxying requests on web to avoid CORS issues
        const arxivUrl = `${BASE_ARXIV_URL}?search_query=${searchParam}&sortBy=${sortField}&sortOrder=${sortDirection}&start=${start}&max_results=${RESULTS_PER_PAGE}`;
        const finalUrl = isWeb
          ? buildProxiedUrl(arxivUrl, proxyConfig)
          : arxivUrl;

        //fetch the XML feed & parse it
        const response = await fetch(finalUrl);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const text = await response.text();
        if (!text.includes("<?xml")) throw new Error("Invalid response format");

        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: "@_",
        });
        const result = parser.parse(text);
        let entries = result.feed?.entry || [];
        if (!Array.isArray(entries)) entries = [entries];

        // normalize the arXiv entries into a standardized shape
        const mappedPapers = entries.map((entry) => ({
          id: String(entry.id),
          title: entry.title.replace(/\n/g, " ").trim(),
          authors: Array.isArray(entry.author)
            ? entry.author.map((a) => a.name).join(", ")
            : entry.author.name,
          summary: entry.summary.replace(/\n/g, " ").trim(),
          comments: entry["arxiv:comment"]?.trim?.() || "",
          journalRef: entry["arxiv:journal_ref"]?.trim?.() || "",
          doi: entry["arxiv:doi"]?.trim?.() || "",
          links: Array.isArray(entry.link)
            ? entry.link.map((l) => ({
                href: l["@_href"],
                rel: l["@_rel"],
                title: l["@_title"],
                type: l["@_type"],
              }))
            : entry.link
            ? [
                {
                  href: entry.link["@_href"],
                  rel: entry.link["@_rel"],
                  title: entry.link["@_title"],
                  type: entry.link["@_type"],
                },
              ]
            : [],
          tags: Array.isArray(entry.category)
            ? entry.category.map((c) => c["@_term"]).slice(0, 2)
            : [entry.category?.["@_term"] || "Science"],
          date: new Date(entry.published).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          link: String(entry.id),
          pdfLink:
            (Array.isArray(entry.link)
              ? entry.link.find(
                  (l) => l["@_type"]?.includes("pdf") || l["@_title"] === "pdf"
                )
              : null)?.["@_href"] || getPdfUrl(String(entry.id)),
        }));

        // merge with existing results when loading more, otherwise replace
        if (loadMore) {
          setPapers((prev) => [...prev, ...mappedPapers]);
        } else {
          setPapers(mappedPapers);
        }

        // determine whether additional pages are available based on result count
        if (mappedPapers.length < RESULTS_PER_PAGE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        triggerHaptic("error");
        if (!loadMore)
          setError("Failed to load papers. Check your connection.");
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [sortBy, sortOrder]
  );

  return {
    papers,
    loading,
    isLoadingMore,
    error,
    hasMore,
    fetchPapers,
  };
};
