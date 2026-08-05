import type {
  HotsiteCheckoutLanguage,
  HotsiteCheckoutOffer,
} from "@/shared/types";

export type CheckoutCartItem = {
  version: 1;
  language: HotsiteCheckoutLanguage;
  offer: HotsiteCheckoutOffer;
  savedAt: string;
};

export type CheckoutCartAction = "continue" | "login" | "removed";

export const checkoutCartKey = "veli.checkout.cart.v1";
export const checkoutCartIntentKey = "veli.checkout.cart.intent";
export const checkoutCartUpdatedEvent = "veli:cart-updated";
export const checkoutCartActionEvent = "veli:cart-action";

export function readCheckoutCart() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(checkoutCartKey);

    if (!storedValue) {
      return null;
    }

    const item = JSON.parse(storedValue) as CheckoutCartItem;

    if (
      item.version !== 1 ||
      typeof item.language?.id !== "number" ||
      typeof item.offer?.id !== "number" ||
      typeof item.offer?.course?.name !== "string" ||
      typeof item.offer?.course?.language?.lang_icon !== "string"
    ) {
      window.localStorage.removeItem(checkoutCartKey);
      return null;
    }

    return item;
  } catch {
    return null;
  }
}

export function saveCheckoutCart(item: CheckoutCartItem) {
  window.localStorage.setItem(checkoutCartKey, JSON.stringify(item));
  window.dispatchEvent(new Event(checkoutCartUpdatedEvent));
}

export function clearCheckoutCart() {
  window.localStorage.removeItem(checkoutCartKey);
  window.dispatchEvent(new Event(checkoutCartUpdatedEvent));
}

export function dispatchCheckoutCartAction(action: CheckoutCartAction) {
  window.dispatchEvent(
    new CustomEvent<CheckoutCartAction>(checkoutCartActionEvent, {
      detail: action,
    })
  );
}

export function saveCheckoutCartIntent(action: Exclude<CheckoutCartAction, "removed">) {
  window.localStorage.setItem(checkoutCartIntentKey, action);
}

export function consumeCheckoutCartIntent() {
  const intent = window.localStorage.getItem(checkoutCartIntentKey);
  window.localStorage.removeItem(checkoutCartIntentKey);

  return intent === "login" || intent === "continue" ? intent : null;
}
