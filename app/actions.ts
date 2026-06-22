"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_HOUSEHOLD_COOKIE, requireHousehold } from "@/lib/data";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function signIn(formData: FormData) {
  const supabase = createClient();
  const email = value(formData, "email");
  const password = value(formData, "password");
  const next = value(formData, "next") || "/dashboard";
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/auth?error=${encodeURIComponent(error.message)}`);
  redirect(next.startsWith("/") ? next : "/dashboard");
}

async function ensureProfile() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email ?? "",
    full_name: typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : null
  });

  return { supabase, user };
}

export async function signUp(formData: FormData) {
  const supabase = createClient();
  const email = value(formData, "email");
  const password = value(formData, "password");
  const fullName = value(formData, "full_name");
  const next = value(formData, "next") || "/dashboard";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/callback?next=${encodeURIComponent(next)}`,
      data: { full_name: fullName }
    }
  });

  if (error) redirect(`/auth?error=${encodeURIComponent(error.message)}`);
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/auth");
}

export async function createHousehold(formData: FormData) {
  const { supabase, user } = await ensureProfile();

  const householdName = value(formData, "name") || "Our Household";
  const { data: household, error } = await supabase
    .from("households")
    .insert({ name: householdName, created_by: user.id })
    .select("id")
    .single();

  if (error) redirect(`/onboarding/household?error=${encodeURIComponent(error.message)}`);

  await supabase.from("household_members").insert({
    household_id: household.id,
    user_id: user.id,
    role: "owner"
  });
  cookies().set(ACTIVE_HOUSEHOLD_COOKIE, household.id, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  const starterCategories = [
    ["Paycheck", "income", "#34c759", "wallet"],
    ["Groceries", "expense", "#ff9500", "cart"],
    ["Home", "expense", "#007aff", "home"],
    ["Transport", "expense", "#5856d6", "car"],
    ["Dining", "expense", "#ff2d55", "utensils"],
    ["Savings", "expense", "#30d158", "piggy-bank"]
  ] as const;

  await supabase.from("categories").insert(
    starterCategories.map(([name, kind, color, icon]) => ({
      household_id: household.id,
      name,
      kind,
      color,
      icon,
      created_by: user.id
    }))
  );

  redirect("/onboarding/invite");
}

export async function switchHousehold(formData: FormData) {
  const { supabase, user } = await ensureProfile();
  const householdId = value(formData, "household_id");
  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .eq("household_id", householdId)
    .maybeSingle();

  if (!membership) redirect("/settings?error=Household not found");

  cookies().set(ACTIVE_HOUSEHOLD_COOKIE, householdId, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function createInvitation(formData: FormData) {
  const { supabase, user, householdId } = await requireHousehold();
  const email = value(formData, "email");
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();

  const { error } = await supabase.from("invitations").insert({
    household_id: householdId,
    email,
    token,
    invited_by: user.id,
    expires_at: expiresAt
  });

  if (error) redirect(`/onboarding/invite?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/onboarding/invite");
}

export async function acceptInvitation(formData: FormData) {
  const { supabase, user } = await ensureProfile();

  const token = value(formData, "token");
  const { data: invite, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .single();

  if (error || !invite) redirect(`/invite/${token}?error=Invite not found or already used`);

  await supabase.from("household_members").upsert(
    {
      household_id: invite.household_id,
      user_id: user.id,
      role: "member"
    },
    { onConflict: "household_id,user_id" }
  );

  await supabase
    .from("invitations")
    .update({
      status: "accepted",
      accepted_by: user.id,
      accepted_at: new Date().toISOString()
    })
    .eq("id", invite.id);

  cookies().set(ACTIVE_HOUSEHOLD_COOKIE, invite.household_id, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  redirect("/dashboard");
}

export async function createAccount(formData: FormData) {
  const { supabase, user, householdId } = await requireHousehold();
  await supabase.from("accounts").insert({
    household_id: householdId,
    name: value(formData, "name"),
    type: value(formData, "type") as "checking",
    balance: Number(value(formData, "balance") || 0),
    is_shared: formData.get("is_shared") === "on",
    owner_id: user.id,
    created_by: user.id
  });
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function createBudget(formData: FormData) {
  const { supabase, user, householdId } = await requireHousehold();
  await supabase.from("budgets").upsert(
    {
      household_id: householdId,
      category_id: value(formData, "category_id"),
      month: `${value(formData, "month")}-01`,
      amount: Number(value(formData, "amount") || 0),
      is_shared: formData.get("is_shared") === "on",
      owner_id: user.id,
      created_by: user.id,
      updated_by: user.id
    },
    { onConflict: "household_id,category_id,month" }
  );
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}

export async function createCategory(formData: FormData) {
  const { supabase, user, householdId } = await requireHousehold();
  await supabase.from("categories").insert({
    household_id: householdId,
    name: value(formData, "name"),
    kind: value(formData, "kind") as "income",
    color: value(formData, "color") || "#007aff",
    icon: value(formData, "icon") || "circle",
    created_by: user.id
  });
  revalidatePath("/settings");
  revalidatePath("/transactions/new");
}

export async function createRecurringItem(formData: FormData) {
  const { supabase, user, householdId } = await requireHousehold();
  await supabase.from("recurring_items").insert({
    household_id: householdId,
    account_id: value(formData, "account_id") || null,
    category_id: value(formData, "category_id") || null,
    amount: Number(value(formData, "amount") || 0),
    kind: value(formData, "kind") as "income" | "expense",
    description: value(formData, "description"),
    frequency: value(formData, "frequency") as "weekly" | "biweekly" | "monthly" | "yearly",
    next_due_on: value(formData, "next_due_on"),
    is_shared: formData.get("is_shared") === "on",
    owner_id: user.id,
    created_by: user.id,
    updated_by: user.id
  });
  revalidatePath("/recurring");
  revalidatePath("/dashboard");
}

export async function deleteRecurringItem(formData: FormData) {
  const { supabase, householdId } = await requireHousehold();
  await supabase
    .from("recurring_items")
    .delete()
    .eq("id", value(formData, "id"))
    .eq("household_id", householdId);
  revalidatePath("/recurring");
}

export async function saveTransaction(formData: FormData) {
  const { supabase, user, householdId } = await requireHousehold();
  const id = value(formData, "id");
  const payload = {
    household_id: householdId,
    account_id: value(formData, "account_id") || null,
    category_id: value(formData, "category_id") || null,
    amount: Number(value(formData, "amount") || 0),
    kind: value(formData, "kind") as "income" | "expense",
    description: value(formData, "description"),
    occurred_on: value(formData, "occurred_on"),
    is_shared: formData.get("is_shared") === "on",
    owner_id: user.id,
    created_by: user.id,
    updated_by: user.id,
    updated_at: new Date().toISOString()
  };

  if (id) {
    await supabase
      .from("transactions")
      .update(payload)
      .eq("id", id)
      .eq("household_id", householdId);
  } else {
    await supabase.from("transactions").insert(payload);
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  redirect("/transactions");
}

export async function deleteTransaction(formData: FormData) {
  const { supabase, householdId } = await requireHousehold();
  await supabase
    .from("transactions")
    .delete()
    .eq("id", value(formData, "id"))
    .eq("household_id", householdId);
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  redirect("/transactions");
}
