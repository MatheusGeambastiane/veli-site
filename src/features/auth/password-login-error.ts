/** Only explicit authentication codes may switch the user to registration. */
export function getPasswordLoginFailure(
  error: unknown,
): "incorrect_password" | "user_not_found" | null {
  if (!error || typeof error !== "object") return null;
  const { status, details } = error as { status?: unknown; details?: unknown };
  if (status !== 401 && status !== 403) return null;
  if (!details || typeof details !== "object") return null;
  const code = (details as { code?: unknown }).code;
  return code === "incorrect_password" || code === "user_not_found" ? code : null;
}
