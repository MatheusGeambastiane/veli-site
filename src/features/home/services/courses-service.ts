import { featuredCourses } from "@/features/home/data";
import { httpClient } from "@/shared/lib/http-client";
import type { ApiResponse, Course } from "@/shared/types";

export const coursesService = {
  async listCourses(): Promise<ApiResponse<Course[]>> {
    try {
      return await httpClient.get<Course[]>("/courses");
    } catch {
      return {
        success: true,
        data: featuredCourses,
      };
    }
  },
};
