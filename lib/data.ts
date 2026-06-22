import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { monthRange, previousMonthKey } from "@/lib/budgeting";

export const ACTIVE_HOUSEHOLD_COOKIE = "active_household_id";

export async function getSessionContext() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: memberships } = await supabase
    .from("household_members")
    .select("household_id, role, households(id, name)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  const activeHouseholdId = cookies().get(ACTIVE_HOUSEHOLD_COOKIE)?.value;
  const member =
    memberships?.find((membership) => membership.household_id === activeHouseholdId) ??
    memberships?.[0] ??
    null;

  return { supabase, user, member, memberships: memberships ?? [] };
}

export async function requireHousehold() {
  const context = await getSessionContext();
  if (!context.member) redirect("/onboarding/household");
  const household = Array.isArray(context.member.households)
    ? context.member.households[0]
    : context.member.households;
  return {
    ...context,
    householdId: context.member.household_id,
    householdName: household?.name ?? "Household"
  };
}

export async function getDashboardData(month: string) {
  const { supabase, householdId, householdName, user } = await requireHousehold();
  const monthDates = monthRange(month);
  const previousDates = monthRange(previousMonthKey(month));

  const [transactions, categories, accounts, budgets, previousBudgets, previousTransactions, members] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, categories(name, color), accounts(name), profiles!transactions_created_by_fkey(full_name, email)")
      .eq("household_id", householdId)
      .gte("occurred_on", monthDates.start)
      .lt("occurred_on", monthDates.end)
      .order("occurred_on", { ascending: false }),
    supabase.from("categories").select("*").eq("household_id", householdId).order("name"),
    supabase.from("accounts").select("*").eq("household_id", householdId).order("name"),
    supabase.from("budgets").select("*, categories(name, color)").eq("household_id", householdId).eq("month", monthDates.start),
    supabase.from("budgets").select("*, categories(name, color)").eq("household_id", householdId).eq("month", previousDates.start),
    supabase.from("transactions").select("*").eq("household_id", householdId).eq("kind", "expense").gte("occurred_on", previousDates.start).lt("occurred_on", previousDates.end),
    supabase.from("household_members").select("user_id, role, profiles(full_name, email)").eq("household_id", householdId)
  ]);

  return {
    user,
    householdId,
    householdName,
    transactions: transactions.data ?? [],
    categories: categories.data ?? [],
    accounts: accounts.data ?? [],
    budgets: budgets.data ?? [],
    previousBudgets: previousBudgets.data ?? [],
    previousTransactions: previousTransactions.data ?? [],
    members: members.data ?? []
  };
}
