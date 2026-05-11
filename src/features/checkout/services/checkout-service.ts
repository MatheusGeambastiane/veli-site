import { publicEnv } from "@/shared/lib/env";
import { httpClient } from "@/shared/lib/http-client";
import type {
  ApiResponse,
  AuthenticateHotsiteUserPayload,
  CreateHotsiteUserPayload,
  HotsiteAuthenticatedUser,
  HotsiteOffersResponse,
} from "@/shared/types";

export const checkoutService = {
  getOffers(): Promise<ApiResponse<HotsiteOffersResponse>> {
    return httpClient.get<HotsiteOffersResponse>("/hotsite/offers/");
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
};
