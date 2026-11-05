import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api3.made2tech.com/api/v1";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: "No refresh token available" },
      { status: 401 }
    );
  }

  try {
    const backendRes = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok || !data.access_token) {
      // Refresh token is expired or invalidated; clear cookies
      cookieStore.delete("access_token");
      cookieStore.delete("refresh_token");
      cookieStore.delete("is_authenticated");
      return NextResponse.json(
        { error: "Session expired. Please log in again." },
        { status: 401 }
      );
    }

    const isProduction = process.env.NODE_ENV === "production";

    cookieStore.set("access_token", data.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    if (data.refresh_token) {
      cookieStore.set("refresh_token", data.refresh_token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Refresh route error:", error);
    return NextResponse.json(
      { error: "Failed to refresh authentication session" },
      { status: 500 }
    );
  }
}
