import type { HotsiteCheckoutOffer } from "@/shared/types";

const cefrLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

type PlacementOfferMatch = {
  offers: HotsiteCheckoutOffer[];
  matchedLevel: string | null;
};

export async function findPlacementOffersWithFallback(
  requestedLevel: string,
  loadOffers: (level: string) => Promise<HotsiteCheckoutOffer[]>,
): Promise<PlacementOfferMatch> {
  const normalizedLevel = requestedLevel.trim().toUpperCase();
  const requestedLevelIndex = cefrLevels.indexOf(
    normalizedLevel as (typeof cefrLevels)[number],
  );

  const levelsToTry = requestedLevelIndex >= 0
    ? cefrLevels.slice(0, requestedLevelIndex + 1).reverse()
    : [normalizedLevel];

  for (const level of levelsToTry) {
    const offers = await loadOffers(level);
    if (offers.length > 0) {
      return { offers, matchedLevel: level };
    }
  }

  return { offers: [], matchedLevel: null };
}
