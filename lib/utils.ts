import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely parse a date string or timestamp from the backend API.
 * 
 * FastAPI / PostgreSQL / SQLite return UTC timestamps without a trailing 'Z'
 * (e.g. "2026-11-13T09:45:00" or "2026-11-13 09:45:00.123456").
 * In standard browser JavaScript, parsing a string without 'Z' or offset treats it
 * as LOCAL time, causing timestamps to be shifted by the user's timezone offset
 * (e.g. 5 hours 30 minutes in IST).
 * 
 * This function ensures UTC timestamps without offset are explicitly interpreted as UTC,
 * and converts them correctly to the client's local timezone (matching Flutter's DateTime.parse('${str}Z').toLocal()).
 */
export function parseServerDate(dateStr?: string | null | Date | number): Date {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? new Date() : dateStr;
  if (typeof dateStr === "number") return new Date(dateStr);

  let str = String(dateStr).trim();
  if (!str) return new Date();

  // If already ends with Z/z or has an explicit timezone offset (+/-HH:MM or +/-HHMM), parse directly
  if (str.endsWith("Z") || str.endsWith("z") || /[+-]\d{2}:?\d{2}$/.test(str)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
  }

  // Normalize space separator to T e.g. "2026-11-13 09:45:00" -> "2026-11-13T09:45:00"
  str = str.replace(" ", "T");

  // If no timezone indicator, append 'Z' to treat as UTC
  const utcDate = new Date(`${str}Z`);
  if (!isNaN(utcDate.getTime())) {
    return utcDate;
  }

  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
}

/**
 * Format a timestamp for chat bubbles (e.g. "03:15 PM" or "15:15")
 */
export function formatMessageTime(dateStr?: string | null | Date | number): string {
  const d = parseServerDate(dateStr);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format a timestamp for conversation list snippets (e.g. "03:15 PM", "Yesterday", "Wed", "Nov 12")
 */
export function formatChatListTime(dateStr?: string | null | Date | number): string {
  if (!dateStr) return "";
  const d = parseServerDate(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (msgDate.getTime() === today.getTime()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  }
  if (msgDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }
  if (now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000 && d.getTime() < today.getTime()) {
    return d.toLocaleDateString([], { weekday: "short" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}
