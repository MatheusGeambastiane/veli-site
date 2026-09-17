"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { snapshotForms, trackAnalyticsEvent } from "@/shared/analytics/analytics";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageStartedAt = useRef<number | null>(null);
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    const now = Date.now();
    if (previousPath.current) {
      trackAnalyticsEvent({
        event_type: "session_end",
        duration_ms: pageStartedAt.current ? now - pageStartedAt.current : 0,
        metadata: { page: previousPath.current },
      });
    }
    previousPath.current = pathname;
    pageStartedAt.current = now;
    trackAnalyticsEvent({ event_type: "page_view" });
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest("a,button");
      if (!target) return;
      const label = (target.textContent ?? target.getAttribute("aria-label") ?? "").trim();
      const href = target instanceof HTMLAnchorElement ? target.getAttribute("href") ?? "" : "";
      if (/oferta|matricul|contrat|começar|checkout/i.test(`${label} ${href}`)) {
        trackAnalyticsEvent({ event_type: "offer_clicked", metadata: { label, href } });
      }
    };
    const handleError = (event: ErrorEvent) => {
      trackAnalyticsEvent({
        event_type: "application_error",
        error_message: event.message,
        error_stack: event.error instanceof Error ? event.error.stack : "",
        form_inputs: snapshotForms(),
        metadata: { filename: event.filename, line: event.lineno, column: event.colno },
      });
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      trackAnalyticsEvent({
        event_type: "application_error",
        error_message: reason instanceof Error ? reason.message : String(reason),
        error_stack: reason instanceof Error ? reason.stack : "",
        form_inputs: snapshotForms(),
        metadata: { kind: "unhandled_rejection" },
      });
    };
    const handlePageHide = () => trackAnalyticsEvent({
      event_type: "session_end",
      duration_ms: pageStartedAt.current ? Date.now() - pageStartedAt.current : 0,
      metadata: { page: previousPath.current },
    }, true);
    document.addEventListener("click", handleClick, true);
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  return children;
}
