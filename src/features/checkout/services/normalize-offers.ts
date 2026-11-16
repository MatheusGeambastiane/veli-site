import type { HotsiteCheckoutOffer } from "@/shared/types";

type OfferSummary = Partial<HotsiteCheckoutOffer> & { id: number };

const levelOrder = ["A1", "A2", "B1", "B2", "C1", "C2"];

function getOfferLevelOrder(offer: HotsiteCheckoutOffer): number {
  const ranks = offer.student_classes.flatMap(({ course }) => {
    const levels = course.levels?.length ? course.levels : course.level ? [course.level] : [];
    return levels.map(({ level }) => {
      const rank = levelOrder.indexOf(level.trim().toUpperCase());
      return rank === -1 ? levelOrder.length : rank;
    });
  });
  return Math.min(levelOrder.length, ...ranks);
}

function isCompleteOffer(offer: OfferSummary): offer is HotsiteCheckoutOffer {
  return typeof offer.name === "string"
    && Array.isArray(offer.student_classes)
    && Array.isArray(offer.billing_options);
}

// Older API versions return one summary per class, without nested classes or payments.
export async function normalizeOffers(
  results: OfferSummary[],
  loadOffer: (id: number) => Promise<HotsiteCheckoutOffer>,
  filters: { languageId?: number | string; level?: string } = {},
): Promise<HotsiteCheckoutOffer[]> {
  if (!Array.isArray(results)) {
    throw new Error("Não foi possível carregar as ofertas. Tente novamente.");
  }
  const unique = new Map<number, OfferSummary>();
  for (const offer of results) {
    if (!offer || typeof offer.id !== "number") {
      throw new Error("Não foi possível carregar as ofertas. Tente novamente.");
    }
    if (!unique.has(offer.id) || isCompleteOffer(offer)) unique.set(offer.id, offer);
  }
  const offers = await Promise.all(Array.from(unique.values(), async (summary) => {
    const offer = isCompleteOffer(summary) ? summary : await loadOffer(summary.id);
    if (!isCompleteOffer(offer)) {
      throw new Error("Não foi possível carregar os detalhes da oferta. Tente novamente.");
    }
    const level = filters.level?.trim().toUpperCase();
    return {
      ...offer,
      student_classes: offer.student_classes.filter(({ course }) => {
        const levels = course.levels?.length ? course.levels : course.level ? [course.level] : [];
        return (filters.languageId === undefined || String(course.language.id) === String(filters.languageId))
          && (!level || levels.some((item) => item.level.trim().toUpperCase() === level));
      }),
    };
  }));
  return offers
    .filter((offer) => offer.student_classes.length > 0)
    .sort((a, b) => getOfferLevelOrder(a) - getOfferLevelOrder(b));
}
