import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { getBackendUrl } from "@/shared/lib/backend-url";

const proxyPrefix = "/api/backend";
const googleAuthPath = "/hotsite/auth/google/";
const createUserPath = "/hotsite/users/";
const loginPath =
  process.env.NEXT_PUBLIC_HOTSITE_LOGIN_PATH || "/student-portal/auth/login/";
const accessTokenCookie = "veli_access_token";
const refreshTokenCookie = "veli_refresh_token";
const sessionAuthHeader = "x-veli-requires-auth";

function getTokenMaxAge(token: string) {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return undefined;
    }

    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { exp?: unknown };

    if (typeof decoded.exp !== "number") {
      return undefined;
    }

    return Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
  } catch {
    return undefined;
  }
}

async function persistSession(data: Record<string, unknown>) {
  const accessToken = data.access_token ?? data.access ?? data.token;
  const refreshToken = data.refresh_token ?? data.refresh;

  if (typeof accessToken !== "string") {
    return { accessStored: false, refreshStored: false };
  }

  const cookieStore = await cookies();
  const baseOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
  const accessMaxAge = getTokenMaxAge(accessToken);
  const refreshMaxAge =
    typeof refreshToken === "string" ? getTokenMaxAge(refreshToken) : undefined;

  cookieStore.set(accessTokenCookie, accessToken, {
    ...baseOptions,
    ...(accessMaxAge === undefined ? {} : { maxAge: accessMaxAge }),
  });
  if (typeof refreshToken === "string") {
    cookieStore.set(refreshTokenCookie, refreshToken, {
      ...baseOptions,
      ...(refreshMaxAge === undefined ? {} : { maxAge: refreshMaxAge }),
    });
  }

  return {
    accessStored: true,
    refreshStored: typeof refreshToken === "string",
  };
}

function removeTokens(data: Record<string, unknown>) {
  const sanitized = { ...data };

  for (const field of [
    "access_token",
    "refresh_token",
    "access",
    "refresh",
    "token",
  ]) {
    delete sanitized[field];
  }

  return sanitized;
}

function isAuthenticationResponse(path: string, method: string) {
  return (
    method === "POST" &&
    [googleAuthPath, createUserPath, loginPath].includes(path)
  );
}

async function forwardRequest(request: NextRequest) {
  const upstreamPath = request.nextUrl.pathname.slice(proxyPrefix.length);
  const upstreamUrl = `${getBackendUrl()}${upstreamPath}${request.nextUrl.search}`;
  const headers = new Headers();
  let usesCookieSession = false;

  for (const name of ["accept", "authorization", "content-type"]) {
    const value = request.headers.get(name);

    if (value) {
      headers.set(name, value);
    }
  }

  if (
    request.headers.get(sessionAuthHeader) === "1" &&
    !headers.has("authorization")
  ) {
    const accessToken = (await cookies()).get(accessTokenCookie)?.value;

    if (accessToken) {
      headers.set("authorization", `Bearer ${accessToken}`);
      usesCookieSession = true;
    }
  }

  try {
    const response = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: request.method === "GET" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
    });
    const responseHeaders = new Headers();
    const contentType = response.headers.get("content-type");

    if (usesCookieSession && response.status === 401) {
      const cookieStore = await cookies();
      cookieStore.delete(accessTokenCookie);
      cookieStore.delete(refreshTokenCookie);
    }

    if (isAuthenticationResponse(upstreamPath, request.method) && response.ok) {
      const data = (await response.json()) as Record<string, unknown>;
      const session = await persistSession(data);
      const sessionStored =
        session.accessStored &&
        (upstreamPath !== googleAuthPath || session.refreshStored);

      if (!sessionStored) {
        return Response.json(
          { message: "A resposta de autenticação não retornou a sessão esperada." },
          { status: 502 }
        );
      }

      return Response.json(removeTokens(data), { status: response.status });
    }

    if (contentType) {
      responseHeaders.set("content-type", contentType);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      { message: "Não foi possível conectar ao backend." },
      { status: 502 }
    );
  }
}

export const GET = forwardRequest;
export const POST = forwardRequest;
export const PATCH = forwardRequest;
