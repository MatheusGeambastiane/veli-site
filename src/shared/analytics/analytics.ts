export type AnalyticsEventType =
  | "page_view"
  | "session_end"
  | "offer_viewed"
  | "offer_clicked"
  | "checkout_step_viewed"
  | "checkout_completed"
  | "request_failed"
  | "application_error"
  | "placement_test_started"
  | "placement_lead_captured"
  | "placement_question_answered"
  | "placement_test_completed"
  | "placement_test_abandoned";

type AnalyticsEventInput = {
  event_type: AnalyticsEventType;
  duration_ms?: number;
  endpoint?: string;
  http_method?: string;
  http_status?: number;
  error_message?: string;
  error_stack?: string;
  form_inputs?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

const endpoint = "/api/backend/analytics/events/";
const sessionKey = "veli.analytics.session.v1";
const utmKey = "veli.analytics.utm-source.v1";
export function getAnalyticsSessionId() {
  let sessionId = window.sessionStorage.getItem(sessionKey);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    window.sessionStorage.setItem(sessionKey, sessionId);
  }
  return sessionId;
}

export function getAnalyticsUtmSource() {
  const params = new URLSearchParams(window.location.search);
  const current = params.get("utm_source") ?? params.get("utm_soruce");
  if (current) window.sessionStorage.setItem(utmKey, current);
  return current ?? window.sessionStorage.getItem(utmKey) ?? "";
}

export function snapshotForms() {
  const inputs: Record<string, unknown> = {};
  document.querySelectorAll<HTMLFormElement>("form").forEach((form, formIndex) => {
    form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input,textarea,select",
    ).forEach((field, fieldIndex) => {
      if (field instanceof HTMLInputElement && ["hidden", "submit", "button"].includes(field.type)) return;
      const fieldName = field.getAttribute("name")
        ?? field.id
        ?? field.getAttribute("aria-label")
        ?? field.getAttribute("placeholder")
        ?? `campo_${fieldIndex}`;
      const safeKey = `${form.getAttribute("name") ?? `form_${formIndex}`}.${fieldName}`;
      if (
        field instanceof HTMLInputElement &&
        ["checkbox", "radio"].includes(field.type)
      ) {
        inputs[safeKey] = field.checked ? "marcado" : "desmarcado";
        return;
      }

      inputs[safeKey] = field.value.trim() ? "preenchido" : "vazio";
    });
  });
  return inputs;
}

export function trackAnalyticsEvent(input: AnalyticsEventInput, immediate = false) {
  if (typeof window === "undefined") return;
  const event = {
    event_id: crypto.randomUUID(),
    event_version: 1,
    source: "site",
    occurred_at: new Date().toISOString(),
    session_id: getAnalyticsSessionId(),
    path: `${window.location.pathname}${window.location.search}`.slice(0, 512),
    page_title: document.title,
    referrer: document.referrer,
    utm_source: getAnalyticsUtmSource(),
    ...input,
  };
  const body = JSON.stringify({ events: [event] });
  if (immediate && navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
