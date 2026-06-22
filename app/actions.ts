"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_HOUSEHOLD_COOKIE, requireHousehold } from "@/lib/data";
import { parseTransactionCsv } from "@/lib/csv-import";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function safeNextPath(path: string) {
  return path.startsWith("/") ? path : "/dashboard";
}

function authErrorMessage(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login")) return "Email or password is incorrect.";
  if (lower.includes("email not confirmed")) return "Please verify your email before signing in.";
  if (lower.includes("already registered")) return "An account already exists for this email. Try signing in instead.";
  if (lower.includes("user already registered")) return "An account already exists for this email. Try signing in instead.";
  if (lower.includes("signup is disabled")) return "New account signup is disabled in Supabase Auth settings.";
  if (lower.includes("email rate limit")) return "Too many verification emails were requested. Wait a few minutes and try again.";
  if (lower.includes("database error")) return "Supabase could not create the account because of a database trigger or profile row issue.";
  if (lower.includes("password")) return message;
  return message || "Something went wrong. Please try again.";
}

export async function signIn(formData: FormData) {
  const supabase = createClient();
  const email = value(formData, "email");
  const password = value(formData, "password");
  const next = value(formData, "next") || "/dashboard";
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/auth?next=${encodeURIComponent(safeNextPath(next))}&error=${encodeURIComponent(authErrorMessage(error.message))}`);
  }
  redirect(safeNextPath(next));
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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/callback?next=${encodeURIComponent(safeNextPath(next))}`,
      data: { full_name: fullName }
    }
  });

  if (error) {
    redirect(`/auth?next=${encodeURIComponent(safeNextPath(next))}&error=${encodeURIComponent(authErrorMessage(error.message))}`);
  }

  if (!data.session) {
    redirect(`/auth/check-email?email=${encodeURIComponent(email)}&next=${encodeURIComponent(safeNextPath(next))}`);
  }

  redirect(safeNextPath(next));
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
    ["Gas", "expense", "#5856d6", "fuel"],
    ["Dining", "expense", "#ff2d55", "utensils"],
    ["Date Nights", "expense", "#af52de", "heart"],
    ["Vacation", "expense", "#5ac8fa", "plane"],
    ["Fun Money", "expense", "#ffcc00", "sparkles"],
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
    type: value(formData, "type") as "checking" | "savings" | "credit" | "cash" | "investment" | "crypto" | "loan",
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

export async function createGoal(formData: FormData) {
  const { supabase, user, householdId } = await requireHousehold();
  const { error } = await supabase.from("goals").insert({
    household_id: householdId,
    name: value(formData, "name"),
    target_amount: Number(value(formData, "target_amount") || 0),
    target_date: value(formData, "target_date") || null,
    color: value(formData, "color") || "#007aff",
    icon: value(formData, "icon") || "flag",
    is_shared: formData.get("is_shared") === "on",
    owner_id: user.id,
    created_by: user.id,
    updated_by: user.id
  });

  if (error) redirect(`/goals?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function addGoalContribution(formData: FormData) {
  const { supabase, user, householdId } = await requireHousehold();
  const goalId = value(formData, "goal_id");
  const amount = Number(value(formData, "amount") || 0);
  const { error } = await supabase.from("goal_contributions").insert({
    goal_id: goalId,
    household_id: householdId,
    amount,
    note: value(formData, "note") || null,
    contributed_on: value(formData, "contributed_on") || new Date().toISOString().slice(0, 10),
    created_by: user.id
  });

  if (error) redirect(`/goals?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function createFinancialNote(formData: FormData) {
  const { supabase, user, householdId } = await requireHousehold();
  const targetType = value(formData, "target_type") as "transaction" | "account" | "goal" | "household";
  const targetId = value(formData, "target_id") || null;
  const body = value(formData, "body");
  const next = value(formData, "next") || "/feed";
  const isShared = formData.has("is_shared") ? formData.get("is_shared") === "on" : true;

  if (!body) redirect(safeNextPath(next));

  const { error } = await supabase.from("financial_notes").insert({
    household_id: householdId,
    target_type: targetType,
    target_id: targetId,
    body,
    is_shared: isShared,
    owner_id: user.id,
    created_by: user.id
  });

  if (error) redirect(`${safeNextPath(next)}?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/feed");
  revalidatePath("/meeting");
  revalidatePath("/accounts");
  revalidatePath("/goals");
  revalidatePath("/transactions");
  redirect(safeNextPath(next));
}

export async function saveNetWorthSnapshot(formData: FormData) {
  const { supabase, user, householdId } = await requireHousehold();
  const assets = Number(value(formData, "assets") || 0);
  const liabilities = Number(value(formData, "liabilities") || 0);
  const snapshotOn = value(formData, "snapshot_on") || new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("net_worth_snapshots").upsert(
    {
      household_id: householdId,
      snapshot_on: snapshotOn,
      assets,
      liabilities,
      created_by: user.id
    },
    { onConflict: "household_id,snapshot_on" }
  );

  if (error) redirect(`/wealth?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/wealth");
  revalidatePath("/dashboard");
  redirect("/wealth");
}

export async function saveNotificationPreferences(formData: FormData) {
  const { supabase, user, householdId } = await requireHousehold();
  const frequency = value(formData, "frequency") as "instant" | "daily" | "weekly";
  const payload = {
    household_id: householdId,
    user_id: user.id,
    frequency,
    budget_alerts: formData.get("budget_alerts") === "on",
    bills: formData.get("bills") === "on",
    goals: formData.get("goals") === "on",
    achievements: formData.get("achievements") === "on",
    household_activity: formData.get("household_activity") === "on",
    insights: formData.get("insights") === "on",
    recurring_transactions: formData.get("recurring_transactions") === "on",
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from("notification_preferences").upsert(payload, {
    onConflict: "household_id,user_id"
  });

  if (error) redirect(`/notifications?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  redirect("/notifications?message=Notification controls saved");
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

export async function importTransactions(formData: FormData) {
  const { supabase, user, householdId } = await requireHousehold();
  const file = formData.get("file");
  const fallbackAccountId = value(formData, "account_id") || null;
  const fallbackCategoryId = value(formData, "category_id") || null;
  const isShared = formData.get("is_shared") === "on";

  if (!(file instanceof File) || file.size === 0) {
    redirect("/transactions/import?error=Choose a CSV file to import");
  }

  const csv = await file.text();
  const imported = parseTransactionCsv(csv).slice(0, 500);

  if (imported.length === 0) {
    redirect("/transactions/import?error=No valid transactions found in that CSV");
  }

  const [{ data: categories }, { data: accounts }] = await Promise.all([
    supabase.from("categories").select("id, name").eq("household_id", householdId),
    supabase.from("accounts").select("id, name").eq("household_id", householdId)
  ]);

  const categoryMap = new Map(
    (categories ?? []).map((category) => [String(category.name).toLowerCase(), category.id])
  );
  const accountMap = new Map(
    (accounts ?? []).map((account) => [String(account.name).toLowerCase(), account.id])
  );

  const payload = imported.map((transaction) => ({
    household_id: householdId,
    account_id: transaction.accountName
      ? accountMap.get(transaction.accountName.toLowerCase()) ?? fallbackAccountId
      : fallbackAccountId,
    category_id: transaction.categoryName
      ? categoryMap.get(transaction.categoryName.toLowerCase()) ?? fallbackCategoryId
      : fallbackCategoryId,
    amount: transaction.amount,
    kind: transaction.kind,
    description: transaction.description,
    occurred_on: transaction.occurred_on,
    is_shared: isShared,
    owner_id: user.id,
    created_by: user.id,
    updated_by: user.id
  }));

  const { error } = await supabase.from("transactions").insert(payload);
  if (error) redirect(`/transactions/import?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  redirect(`/transactions?imported=${imported.length}`);
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
