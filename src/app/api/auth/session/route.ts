import { cookies } from "next/headers";
import { getBackendUrl } from "@/shared/lib/backend-url";

const accessTokenCookie = "veli_access_token";
const refreshTokenCookie = "veli_refresh_token";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(accessTokenCookie)?.value;
  const headers = { "Cache-Control": "private, no-store" };

  if (!accessToken) {
    return Response.json({ authenticated: false }, { headers });
  }

  try {
    const response = await fetch(`${getBackendUrl()}/hotsite/users/me/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 401) {
      cookieStore.delete(accessTokenCookie);
      cookieStore.delete(refreshTokenCookie);
      return Response.json({ authenticated: false }, { headers });
    }

    if (!response.ok) {
      return Response.json(
        { message: "Não foi possível verificar a sessão. Tente novamente." },
        { status: 502, headers }
      );
    }

    return Response.json({ authenticated: true }, { headers });
  } catch {
    return Response.json(
      { message: "Não foi possível verificar a sessão. Tente novamente." },
      { status: 502, headers }
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();

  cookieStore.delete(accessTokenCookie);
  cookieStore.delete(refreshTokenCookie);

  return new Response(null, { status: 204 });
}
