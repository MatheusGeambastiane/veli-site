import { cookies } from "next/headers";

const accessTokenCookie = "veli_access_token";
const refreshTokenCookie = "veli_refresh_token";

export async function GET() {
  const cookieStore = await cookies();

  return Response.json({
    authenticated: cookieStore.has(accessTokenCookie),
  });
}

export async function DELETE() {
  const cookieStore = await cookies();

  cookieStore.delete(accessTokenCookie);
  cookieStore.delete(refreshTokenCookie);

  return new Response(null, { status: 204 });
}
