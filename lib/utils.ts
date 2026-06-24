import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value ?? 0);
}

export function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === yesterday.getTime()) return "Yesterday";

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short"
  }).format(date);
}

export function formatMonthTitle(month: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric"
  }).format(new Date(`${month}-01T00:00:00`));
}

export function categoryEmoji(categoryName: string | null | undefined) {
  const name = categoryName?.toLowerCase() ?? "";
  if (name.includes("grocer") || name.includes("food")) return "🛒";
  if (name.includes("dining") || name.includes("restaurant") || name.includes("date")) return "🍔";
  if (name.includes("gas") || name.includes("fuel") || name.includes("transport")) return "⛽";
  if (name.includes("rent") || name.includes("mortgage") || name.includes("housing")) return "🏠";
  if (name.includes("utilit") || name.includes("electric") || name.includes("internet")) return "⚡";
  if (name.includes("income") || name.includes("pay")) return "💰";
  if (name.includes("travel") || name.includes("vacation")) return "✈️";
  if (name.includes("fun") || name.includes("entertainment")) return "🎟️";
  if (name.includes("health") || name.includes("medical")) return "❤️";
  return "💳";
}

export function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}
