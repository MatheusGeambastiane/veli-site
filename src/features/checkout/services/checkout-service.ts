import { publicEnv } from "@/shared/lib/env";
import { httpClient } from "@/shared/lib/http-client";
import type {
  ApiResponse,
  AuthenticateHotsiteGooglePayload,
  AuthenticateHotsiteUserPayload,
  CreateHotsiteUserPayload,
  CouponPreview,
  HotsiteAuthenticatedUser,
  HotsiteCheckoutOffersResponse,
  HotsiteLanguagesResponse,
  HotsiteOffer,
  HotsiteOrderPayload,
  HotsiteOrderResponse,
  HotsiteOffersResponse,
  HotsitePaymentStatusResponse,
  HotsiteStartCardPaymentPayload,
  UpdateHotsiteUserPayload,
  ViaCepResponse,
} from "@/shared/types";

export const checkoutService = {
  async getSessionStatus(): Promise<{ authenticated: boolean }> {
    const response = await fetch("/api/auth/session", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Não foi possível verificar a sessão.");
    }

    return (await response.json()) as { authenticated: boolean };
  },

  async logout(): Promise<void> {
    const response = await fetch("/api/auth/session", { method: "DELETE" });

    if (!response.ok) {
      throw new Error("Não foi possível encerrar a sessão.");
    }
  },

  getCurrentUser(): Promise<ApiResponse<HotsiteAuthenticatedUser>> {
    return httpClient.get<HotsiteAuthenticatedUser>("/hotsite/users/me/", {
      requiresAuth: true,
    });
  },

  getLanguages(): Promise<ApiResponse<HotsiteLanguagesResponse>> {
    return httpClient.get<HotsiteLanguagesResponse>("/hotsite/languages/");
  },

  getOffersByLanguage(
    languageId: number | string,
    level?: string
  ): Promise<ApiResponse<HotsiteCheckoutOffersResponse>> {
    return httpClient.get<HotsiteCheckoutOffersResponse>(
      `/hotsite/offers/?language=${encodeURIComponent(String(languageId))}${level ? `&level=${encodeURIComponent(level)}` : ""}`
    );
  },

  getOffers(): Promise<ApiResponse<HotsiteOffersResponse>> {
    return httpClient.get<HotsiteOffersResponse>("/hotsite/offers/");
  },

  getOffer(offerId: number | string): Promise<ApiResponse<HotsiteOffer>> {
    return httpClient.get<HotsiteOffer>(
      `/hotsite/offers/${encodeURIComponent(String(offerId))}/`
    );
  },

  createUser(
    payload: CreateHotsiteUserPayload
  ): Promise<ApiResponse<HotsiteAuthenticatedUser>> {
    return httpClient.post<HotsiteAuthenticatedUser, CreateHotsiteUserPayload>(
      "/hotsite/users/",
      payload
    );
  },

  authenticateUser(
    payload: AuthenticateHotsiteUserPayload
  ): Promise<ApiResponse<HotsiteAuthenticatedUser>> {
    return httpClient.post<HotsiteAuthenticatedUser, AuthenticateHotsiteUserPayload>(
      publicEnv.hotsiteLoginPath,
      payload
    );
  },

  authenticateWithGoogle(
    payload: AuthenticateHotsiteGooglePayload
  ): Promise<ApiResponse<HotsiteAuthenticatedUser>> {
    return httpClient.post<
      HotsiteAuthenticatedUser,
      AuthenticateHotsiteGooglePayload
    >("/hotsite/auth/google/", payload);
  },

  updateCurrentUser(
    payload: UpdateHotsiteUserPayload,
    token?: string
  ): Promise<ApiResponse<HotsiteAuthenticatedUser>> {
    return httpClient.patch<HotsiteAuthenticatedUser, UpdateHotsiteUserPayload>(
      "/hotsite/users/me/",
      payload,
      {
        requiresAuth: true,
        tokenProvider: token ? () => token : undefined,
      }
    );
  },

  createOrder(
    payload: HotsiteOrderPayload,
    token?: string
  ): Promise<ApiResponse<HotsiteOrderResponse>> {
    return httpClient.post<HotsiteOrderResponse, HotsiteOrderPayload>(
      "/hotsite/orders/",
      payload,
      {
        requiresAuth: true,
        tokenProvider: token ? () => token : undefined,
      }
    );
  },

  validateCoupon(
    offerId: number,
    payload: { coupon_code: string; billing_option_code: string }
  ): Promise<ApiResponse<CouponPreview>> {
    return httpClient.post<CouponPreview, typeof payload>(
      `/hotsite/offers/${encodeURIComponent(String(offerId))}/validate-coupon/`,
      payload
    );
  },

  startCardPayment(
    orderId: number | string,
    payload: HotsiteStartCardPaymentPayload,
    token?: string
  ): Promise<ApiResponse<unknown>> {
    return httpClient.post<unknown, HotsiteStartCardPaymentPayload>(
      `/hotsite/orders/${encodeURIComponent(String(orderId))}/start-payment/`,
      payload,
      {
        requiresAuth: true,
        tokenProvider: token ? () => token : undefined,
      }
    );
  },

  getPaymentStatus(
    orderId: number | string,
    token?: string
  ): Promise<ApiResponse<HotsitePaymentStatusResponse>> {
    return httpClient.get<HotsitePaymentStatusResponse>(
      `/hotsite/orders/${encodeURIComponent(String(orderId))}/payment-status/`,
      {
        requiresAuth: true,
        tokenProvider: token ? () => token : undefined,
      }
    );
  },

  async lookupCep(cep: string): Promise<ViaCepResponse> {
    const normalizedCep = cep.replace(/\D/g, "");
    const response = await fetch(
      `https://viacep.com.br/ws/${encodeURIComponent(normalizedCep)}/json/`
    );

    if (!response.ok) {
      throw new Error("Não foi possível consultar o CEP.");
    }

    const data = (await response.json()) as ViaCepResponse;

    if (data.erro) {
      throw new Error("CEP não encontrado.");
    }

    return data;
  },
};
