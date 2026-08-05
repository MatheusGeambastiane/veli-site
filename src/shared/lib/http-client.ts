import { publicEnv } from "@/shared/lib/env";
import type { ApiError, ApiResponse, AuthTokenProvider } from "@/shared/types";

type HttpMethod = "GET" | "POST" | "PATCH";

const sessionAuthHeader = "X-Veli-Requires-Auth";

type RequestOptions = {
  requiresAuth?: boolean;
  headers?: HeadersInit;
  tokenProvider?: AuthTokenProvider;
};

class HttpClient {
  private tokenProvider?: AuthTokenProvider;

  setTokenProvider(provider: AuthTokenProvider) {
    this.tokenProvider = provider;
  }

  async get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("GET", path, undefined, options);
  }

  async post<T, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>("POST", path, body, options);
  }

  async patch<T, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", path, body, options);
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const headers = new Headers(options?.headers);
    headers.set("Content-Type", "application/json");

    if (options?.requiresAuth) {
      headers.set(sessionAuthHeader, "1");
      const token =
        (await options.tokenProvider?.()) ?? (await this.tokenProvider?.());

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    const response = await fetch(`${publicEnv.apiUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    if (!response.ok) {
      let details: unknown = null;

      try {
        details = await response.json();
      } catch {
        details = null;
      }

      const error: ApiError = {
        message: "A requisição para a API falhou.",
        status: response.status,
        details,
      };

      throw error;
    }

    if (response.status === 204) {
      return { success: true, data: undefined as T };
    }

    const data = (await response.json()) as T;
    return { success: true, data };
  }
}

export const httpClient = new HttpClient();
