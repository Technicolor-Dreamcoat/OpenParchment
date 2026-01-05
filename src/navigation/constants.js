import { Platform } from "react-native";
import { API_ENDPOINTS, FEATURE_FLAGS } from "../config/apiConfig";

//arxiv (and proxy) endpoints
export const BASE_ARXIV_URL = API_ENDPOINTS.arxiv;
export const DOI_BASE_URL = API_ENDPOINTS.doiBase;
export const proxyConfig = {
  enabled: FEATURE_FLAGS.useCorsProxy,
  proxyBase: API_ENDPOINTS.corsProxyBase,
};

//determines if on web (vs native)
export const isWeb = Platform.OS === "web";
