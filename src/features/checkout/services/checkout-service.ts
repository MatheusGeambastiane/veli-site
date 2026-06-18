import { publicEnv } from "@/shared/lib/env";
import { httpClient } from "@/shared/lib/http-client";
import type {
  ApiResponse,
  AuthenticateHotsiteUserPayload,
  CreateHotsiteUserPayload,
  HotsiteAuthenticatedUser,
  HotsiteCheckoutOffersResponse,
  HotsiteLanguagesResponse,
  HotsiteOffer,
  HotsiteOrderPayload,
  HotsiteOrderResponse,
  HotsiteOffersResponse,
  HotsitePaymentStatusResponse,
  ViaCepResponse,
} from "@/shared/types";

export const checkoutService = {
  getLanguages(): Promise<ApiResponse<HotsiteLanguagesResponse>> {
    return httpClient.get<HotsiteLanguagesResponse>("/hotsite/languages/");
  },

  getOffersByLanguage(
    languageId: number | string
  ): Promise<ApiResponse<HotsiteCheckoutOffersResponse>> {
    return httpClient.get<HotsiteCheckoutOffersResponse>(
      `/hotsite/offers/?language=${encodeURIComponent(String(languageId))}`
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

  createOrder(
    payload: HotsiteOrderPayload,
    token: string
  ): Promise<ApiResponse<HotsiteOrderResponse>> {
    return httpClient.post<HotsiteOrderResponse, HotsiteOrderPayload>(
      "/hotsite/orders/",
      payload,
      {
        requiresAuth: true,
        tokenProvider: () => token,
      }
    );
  },

  getPaymentStatus(
    orderId: number | string,
    token?: string
  ): Promise<ApiResponse<HotsitePaymentStatusResponse>> {
    return httpClient.get<HotsitePaymentStatusResponse>(
      `/hotsite/orders/${encodeURIComponent(String(orderId))}/payment-status/`,
      token
        ? {
            requiresAuth: true,
            tokenProvider: () => token,
          }
        : undefined
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
