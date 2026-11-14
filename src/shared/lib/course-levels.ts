import type { HotsiteCourse } from "@/shared/types/checkout";

export function getCourseLevels(course: HotsiteCourse) {
  return course.levels?.length ? course.levels : course.level ? [course.level] : [];
}

export function formatCourseLevels(course: HotsiteCourse) {
  return getCourseLevels(course).map((level) => level.level).join(", ") || "Não informado";
}

export function courseHasLevel(course: HotsiteCourse, level: string) {
  const normalizedLevel = level.trim().toUpperCase();
  return getCourseLevels(course).some((item) => item.level.trim().toUpperCase() === normalizedLevel);
}
