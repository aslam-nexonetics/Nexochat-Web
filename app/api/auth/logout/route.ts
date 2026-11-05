import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api3.made2tech.com/api/v1";

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (accessToken) {
    try {
      // Proactively notify backend about logout
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
    } catch (e) {
      console.warn("Backend logout notification warning:", e);
    }
  }

  // Clear all cookies
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("is_authenticated");
  cookieStore.delete("shalabam_token");

  return NextResponse.json({ success: true, message: "Logged out successfully" });
}
