import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api3.made2tech.com/api/v1";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailOrUsername, password } = body;

    if (!emailOrUsername || !password) {
      return NextResponse.json(
        { error: "Email or username and password are required" },
        { status: 400 }
      );
    }

    // Call backend login endpoint
    const backendRes = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email_or_username: emailOrUsername,
        password: password,
      }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      const errorMessage =
        data.detail ||
        data.message ||
        data.error ||
        (Array.isArray(data.non_field_errors)
          ? data.non_field_errors[0]
          : "Invalid credentials");
      return NextResponse.json({ error: errorMessage }, { status: backendRes.status });
    }

    const accessToken = data.access_token;
    const refreshToken = data.refresh_token;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Invalid token response from authentication server" },
        { status: 502 }
      );
    }

    // Fetch user details from /auth/me/
    let userData = null;
    try {
      const userRes = await fetch(`${API_BASE_URL}/auth/me/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (userRes.ok) {
        const rawUser = await userRes.json();
        userData = {
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
      }
    } catch (e) {
      console.warn("Could not fetch user details during login:", e);
    }

    // Set secure httpOnly cookies
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === "production";

    // 7 days expiration for refresh token, 1 day for access token
    cookieStore.set("access_token", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    if (refreshToken) {
      cookieStore.set("refresh_token", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    // Lightweight non-sensitive cookie for client & middleware checks
    cookieStore.set("is_authenticated", "true", {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
