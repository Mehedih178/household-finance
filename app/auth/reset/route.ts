import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next");
  const supabase = createClient();

  await supabase.auth.signOut();

  const authUrl = new URL("/auth", request.url);
  if (next?.startsWith("/")) authUrl.searchParams.set("next", next);
  authUrl.searchParams.set("message", "You are signed out. Create a fresh account or sign in again.");

  return NextResponse.redirect(authUrl);
}
