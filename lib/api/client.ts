/**
 * Typed API Client for Nexonetics Cloud Web
 *
 * Uses the Next.js Route Handler Proxy (/api/proxy) to securely attach
 * httpOnly Bearer tokens without exposing JWTs to client-side JavaScript.
 *
 * Includes a Promise-based lock (Completer pattern) matching Flutter's
 * TokenRefreshService to serialize concurrent refresh requests.
 */

type RequestOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>;
};

class ApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const url = new URL(`/api/proxy/${cleanPath}`, window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private async handleTokenRefresh(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          return true;
        } else {
          // If refresh failed, trigger client logout
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("nexo:session-expired"));
          }
          return false;
        }
      } catch (err) {
        console.error("Token refresh network failure:", err);
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers = {}, ...rest } = options;
    const url = this.buildUrl(path, params);

    const mergedHeaders: Record<string, string> = {
      Accept: "application/json",
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(headers as Record<string, string>),
    };

    let response = await fetch(url, {
      headers: mergedHeaders,
      ...rest,
    });

    // Proactive 401 / 403 retry (FastAPI backends return 401 or 403 when unauthenticated/expired)
    if ((response.status === 401 || response.status === 403) && !path.includes("auth/")) {
      const refreshed = await this.handleTokenRefresh();
      if (refreshed) {
        response = await fetch(url, {
          headers: mergedHeaders,
          ...rest,
        });
      }
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: response.statusText };
      }

      const errorMessage =
        errorData.detail ||
        errorData.message ||
        errorData.error ||
        `Request failed with status ${response.status}`;

      const error = new Error(errorMessage) as Error & { status: number; data: unknown };
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json() as Promise<T>;
    }

    return response.text() as unknown as Promise<T>;
  }

  get<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { method: "GET", ...options });
  }

  post<T = unknown>(path: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request<T>(path, { method: "POST", body, ...options });
  }

  put<T = unknown>(path: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request<T>(path, { method: "PUT", body, ...options });
  }

  patch<T = unknown>(path: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request<T>(path, { method: "PATCH", body, ...options });
  }

  delete<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { method: "DELETE", ...options });
  }
}

export const apiClient = new ApiClient();
