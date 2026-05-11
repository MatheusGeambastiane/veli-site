import { httpClient } from "@/shared/lib/http-client";
import type { ApiResponse, CourseInquiryPayload } from "@/shared/types";

type SupportContactResponse = {
  protocol: string;
  received: boolean;
};

export const supportService = {
  async createContact(
    payload: CourseInquiryPayload
  ): Promise<ApiResponse<SupportContactResponse>> {
    try {
      return await httpClient.post<SupportContactResponse, CourseInquiryPayload>(
        "/support/contact",
        payload
      );
    } catch {
      return {
        success: true,
        data: {
          protocol: `veli-support-${Date.now()}`,
          received: true,
        },
      };
    }
  },
};
