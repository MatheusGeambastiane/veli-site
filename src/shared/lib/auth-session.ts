export const authSessionUpdatedEvent = "veli:auth-session-updated";

export function notifyAuthSessionChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(authSessionUpdatedEvent));
  }
}
