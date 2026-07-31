import type { NextRequest } from "next/server";

const proxyPrefix = "/api/backend";
const fallbackBackendUrl = "http://localhost:8000";

function getBackendUrl() {
  return (
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    fallbackBackendUrl
  ).replace(/\/$/, "");
}

async function forwardRequest(request: NextRequest) {
  const upstreamPath = request.nextUrl.pathname.slice(proxyPrefix.length);
  const upstreamUrl = `${getBackendUrl()}${upstreamPath}${request.nextUrl.search}`;
  const headers = new Headers();

  for (const name of ["accept", "authorization", "content-type"]) {
    const value = request.headers.get(name);

    if (value) {
      headers.set(name, value);
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
