import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api3.made2tech.com/api/v1";

export async function GET() {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  // Helper to fetch user profile
  async function fetchUser(token: string) {
    const res = await fetch(`${API_BASE_URL}/auth/me/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res;
  }

  let userRes = accessToken ? await fetchUser(accessToken) : null;

  // If token is expired (401) and we have a refresh token, rotate token automatically
  if ((!userRes || userRes.status === 401) && refreshToken) {
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

        userRes = await fetchUser(accessToken!);
      }
    } catch (e) {
      console.warn("Silent token rotation in /api/auth/me failed:", e);
    }
  }

  if (!userRes || !userRes.ok) {
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
    cookieStore.delete("is_authenticated");
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const rawUser = await userRes.json();
  const userData = {
    id: rawUser.id,
    email: rawUser.email,
    username: rawUser.username,
    firstName: rawUser.first_name || "",
    lastName: rawUser.last_name || "",
    fullName:
      rawUser.full_name ||
      `${rawUser.first_name || ""} ${rawUser.last_name || ""}`.trim() ||
      rawUser.username,
    phone: rawUser.phone || "",
    role: rawUser.role || "user",
    status: rawUser.status || "active",
    avatarUrl: rawUser.avatar_url || null,
    timezone: rawUser.timezone || "UTC",
    language: rawUser.language || "en",
    isEmailVerified: rawUser.is_email_verified ?? false,
    isPhoneVerified: rawUser.is_phone_verified ?? false,
  };

  return NextResponse.json({
    authenticated: true,
    user: userData,
  });
}
