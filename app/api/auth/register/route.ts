import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api3.made2tech.com/api/v1";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, phone, email, username, password } = body;

    if (!email || !username || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "All required fields must be completed." },
        { status: 400 }
      );
    }

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone ? phone.trim() : "",
      email: email.trim().toLowerCase(),
      username: username.trim(),
      password: password,
      timezone: "UTC",
      language: "en",
    };

    const backendRes = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      let errorMessage = "Registration failed";
      if (data.detail) errorMessage = data.detail;
      else if (data.message) errorMessage = data.message;
      else if (data.error) errorMessage = data.error;
      else if (data.errors) {
        if (typeof data.errors === "object") {
          const firstKey = Object.keys(data.errors)[0];
          errorMessage = `${firstKey}: ${data.errors[firstKey]}`;
        }
      } else if (data.email) {
        errorMessage = `Email: ${Array.isArray(data.email) ? data.email[0] : data.email}`;
      } else if (data.username) {
        errorMessage = `Username: ${Array.isArray(data.username) ? data.username[0] : data.username}`;
      }
      return NextResponse.json({ error: errorMessage }, { status: backendRes.status });
    }

    return NextResponse.json({
      success: true,
      message: "Registration successful! You may now sign in.",
      data,
    });
  } catch (error) {
    console.error("Registration route error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}
