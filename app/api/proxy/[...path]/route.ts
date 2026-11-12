import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api3.made2tech.com/api/v1";

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  let subpath = path.join("/");
  const url = new URL(request.url);

  // Preserve trailing slash if present in request URL, or ensure trailing slash for endpoints
  // that FastAPI strictly requires them on (user-collections, profile, chat, users, auth/me, jobs, jobs/companies)
  const hasTrailingSlash =
    url.pathname.endsWith("/") ||
    request.nextUrl.pathname.endsWith("/") ||
    subpath.startsWith("user-collections") ||
    subpath.startsWith("profile") ||
    subpath.startsWith("chat") ||
    subpath.startsWith("users") ||
    subpath.startsWith("fcm") ||
    subpath.endsWith("profile/me") ||
    subpath === "auth/me" ||
    subpath === "jobs" ||
    subpath === "jobs/companies";

  if (hasTrailingSlash && !subpath.endsWith("/")) {
    subpath = `${subpath}/`;
  }

  const targetUrl = `${API_BASE_URL}/${subpath}${url.search}`;

  const cookieStore = await cookies();
  let accessToken = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;
  const shalabamToken = cookieStore.get("shalabam_token")?.value;

  // Proactively refresh if access_token is absent but refresh_token is present
  if (!accessToken && refreshToken && !subpath.startsWith("auth/")) {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        accessToken = refreshData.access_token;
        const isProduction = process.env.NODE_ENV === "production";

        cookieStore.set("access_token", accessToken!, {
          httpOnly: true,
          secure: isProduction,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24,
        });

        if (refreshData.refresh_token) {
          cookieStore.set("refresh_token", refreshData.refresh_token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
          });
        }
      }
    } catch (e) {
      // Continue and let backend respond
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  if (shalabamToken) {
    headers["X-Shalabam-Token"] = shalabamToken;
  }

  // Pass along custom client headers if provided
  const clientShalabamHeader = request.headers.get("x-shalabam-token");
  if (clientShalabamHeader) {
    headers["X-Shalabam-Token"] = clientShalabamHeader;
  }

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  let body: BodyInit | undefined = undefined;
  if (["POST", "PUT", "PATCH"].includes(request.method)) {
    const rawBody = await request.text();
    if (rawBody) {
      body = rawBody;
    }
  }

  try {
    let backendRes = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    // If 404 Not Found on GET, retry with/without trailing slash to satisfy FastAPI strict routing
    if (backendRes.status === 404 && request.method === "GET") {
      const altSubpath = subpath.endsWith("/") ? subpath.slice(0, -1) : `${subpath}/`;
      const altTargetUrl = `${API_BASE_URL}/${altSubpath}${url.search}`;
      try {
        const altRes = await fetch(altTargetUrl, {
          method: request.method,
          headers,
        });
        if (altRes.ok || (altRes.status !== 404 && altRes.status !== 422)) {
          backendRes = altRes;
        }
      } catch {
        // Continue with original response
      }
    }

    // If 401 Unauthorized or 403 Forbidden on protected endpoints, attempt token refresh once
    const isAuthError =
      backendRes.status === 401 ||
      (backendRes.status === 403 && !subpath.startsWith("auth/"));

    if (isAuthError) {
      const activeRefreshToken = cookieStore.get("refresh_token")?.value || refreshToken;
      if (activeRefreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: activeRefreshToken }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newAccessToken = refreshData.access_token;
            const isProduction = process.env.NODE_ENV === "production";

            cookieStore.set("access_token", newAccessToken, {
              httpOnly: true,
              secure: isProduction,
              sameSite: "lax",
              path: "/",
              maxAge: 60 * 60 * 24,
            });

            if (refreshData.refresh_token) {
              cookieStore.set("refresh_token", refreshData.refresh_token, {
                httpOnly: true,
                secure: isProduction,
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 7,
              });
            }

            headers["Authorization"] = `Bearer ${newAccessToken}`;

            // Retry the original request with the fresh token
            backendRes = await fetch(targetUrl, {
              method: request.method,
              headers,
              body,
            });
          }
        } catch (refreshErr) {
          console.warn("Proxy server-side refresh failed:", refreshErr);
        }
      }
    }

    const responseContentType = backendRes.headers.get("content-type") || "";
    if (responseContentType.includes("application/json")) {
      const data = await backendRes.json();
      return NextResponse.json(data, { status: backendRes.status });
    } else {
      const text = await backendRes.text();
      return new NextResponse(text, {
        status: backendRes.status,
        headers: { "Content-Type": responseContentType },
      });
    }
  } catch (error) {
    console.error(`Proxy error for ${targetUrl}:`, error);
    return NextResponse.json(
      { error: "Failed to communicate with backend service" },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
