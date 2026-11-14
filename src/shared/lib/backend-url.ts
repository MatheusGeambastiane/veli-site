export function getBackendUrl() {
  const fallback = process.env.NODE_ENV === "production"
    ? "https://api.escolaveli.com"
    : "http://localhost:8000";

  return (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || fallback).replace(/\/$/, "");
}
