import { httpClient } from "@/shared/lib/http-client";
import type {
  PlacementAnswerResponse,
  PlacementLanguage,
  PlacementResumeResponse,
  PlacementStartResponse,
} from "@/features/placement-test/types";

const languagesCacheKey = "veli.placement-test.languages.v1";
const languagesCacheTtl = 5 * 60 * 1000;
type LanguagesCache = { data: PlacementLanguage[]; expiresAt: number };
let languagesCache: LanguagesCache | null = null;
let languagesRequest: Promise<PlacementLanguage[]> | null = null;

function readLanguagesCache(): LanguagesCache | null {
  if (languagesCache && languagesCache.expiresAt > Date.now()) return languagesCache;
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(languagesCacheKey);
    if (!stored) return null;
    const cached: LanguagesCache = JSON.parse(stored);
    if (cached.expiresAt > Date.now() && Array.isArray(cached.data)) {
      languagesCache = cached;
      return cached;
    }
    window.sessionStorage.removeItem(languagesCacheKey);
  } catch {
    // Storage may be unavailable; the request still works with memory caching.
  }
  return null;
}

async function getLanguages(): Promise<PlacementLanguage[]> {
  const cached = readLanguagesCache();
  if (cached) return cached.data;
  if (languagesRequest) return languagesRequest;

  languagesRequest = httpClient.get<PlacementLanguage[]>("/hotsite/placement-test/languages/")
    .then(({ data }) => {
      languagesCache = { data, expiresAt: Date.now() + languagesCacheTtl };
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem(languagesCacheKey, JSON.stringify(languagesCache));
        } catch {
          // Keep the in-memory cache when browser storage is unavailable.
        }
      }
      return data;
    })
    .finally(() => { languagesRequest = null; });

  return languagesRequest;
}

export const placementTestService = {
  languages: getLanguages,
  start: async (payload: {
    name: string;
    email: string;
    phone: string;
    language_id: number;
    analytics_session_id: string;
    utm_source: string;
    referrer: string;
    marketing_consent: boolean;
  }) => (await httpClient.post<PlacementStartResponse, typeof payload>("/hotsite/placement-test/leads/", payload)).data,
  resume: async (leadId: string) => (
    await httpClient.get<PlacementResumeResponse>(`/hotsite/placement-test/leads/${leadId}/next-question/`)
  ).data,
  answer: async (leadId: string, payload: { question_id: number; option_id: number; response_ms: number }) => (
    await httpClient.post<PlacementAnswerResponse, typeof payload>(
      `/hotsite/placement-test/leads/${leadId}/answers/`,
      payload,
    )
  ).data,
};
