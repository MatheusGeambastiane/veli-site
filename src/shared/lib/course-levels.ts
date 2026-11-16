import type { HotsiteCheckoutOffer, HotsiteCourse } from "@/shared/types/checkout";

export function getCourseLevels(course: HotsiteCourse) {
  return course.levels?.length ? course.levels : course.level ? [course.level] : [];
}

export function formatCourseLevels(course: HotsiteCourse) {
  return getCourseLevels(course)
    .map((level) => level.level)
    .sort((a, b) => a.trim().localeCompare(b.trim(), "en", { numeric: true, sensitivity: "base" }))
    .join(", ") || "Não informado";
}

export function formatOfferLevels(offer: HotsiteCheckoutOffer) {
  const levels = offer.student_classes.flatMap(({ course }) =>
    getCourseLevels(course).map(({ level }) => level.trim().toUpperCase())
  );
  return Array.from(new Set(levels.filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true, sensitivity: "base" }))
    .join(", ") || "Não informado";
}

export function courseHasLevel(course: HotsiteCourse, level: string) {
  const normalizedLevel = level.trim().toUpperCase();
  return getCourseLevels(course).some((item) => item.level.trim().toUpperCase() === normalizedLevel);
}
