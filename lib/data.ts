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
  const streakStartDate = new Date(`${monthDates.start}T00:00:00`);
  streakStartDate.setMonth(streakStartDate.getMonth() - 5);
  const streakStart = streakStartDate.toISOString().slice(0, 10);

  const [transactions, categories, accounts, budgets, previousBudgets, previousTransactions, streakBudgets, streakTransactions, members, goals, goalContributions, recurring, snapshots, notificationPreferences, notificationReads] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, categories(name, color), accounts(name), profiles!transactions_created_by_fkey(full_name, email)")
      .eq("household_id", householdId)
      .gte("occurred_on", monthDates.start)
      .lt("occurred_on", monthDates.end)
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("*").eq("household_id", householdId).order("name"),
    supabase.from("accounts").select("*").eq("household_id", householdId).order("name"),
    supabase.from("budgets").select("*, categories(name, color)").eq("household_id", householdId).eq("month", monthDates.start),
    supabase.from("budgets").select("*, categories(name, color)").eq("household_id", householdId).eq("month", previousDates.start),
    supabase.from("transactions").select("*").eq("household_id", householdId).eq("kind", "expense").gte("occurred_on", previousDates.start).lt("occurred_on", previousDates.end),
    supabase.from("budgets").select("*").eq("household_id", householdId).gte("month", streakStart),
    supabase.from("transactions").select("*").eq("household_id", householdId).gte("occurred_on", streakStart).lt("occurred_on", monthDates.end),
    supabase.from("household_members").select("user_id, role, profiles(full_name, email)").eq("household_id", householdId),
    supabase.from("goals").select("*").eq("household_id", householdId),
    supabase.from("goal_contributions").select("*, profiles(full_name, email)").eq("household_id", householdId),
    supabase.from("recurring_items").select("*").eq("household_id", householdId).order("next_due_on"),
    supabase.from("net_worth_snapshots").select("*").eq("household_id", householdId).order("snapshot_on", { ascending: false }).limit(6),
    supabase
      .from("notification_preferences")
      .select("*")
      .eq("household_id", householdId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("notification_reads")
      .select("notification_id")
      .eq("household_id", householdId)
      .eq("user_id", user.id)
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
    streakBudgets: streakBudgets.data ?? [],
    streakTransactions: streakTransactions.data ?? [],
    goals: goals.data ?? [],
    goalContributions: goalContributions.data ?? [],
    members: members.data ?? [],
    recurring: recurring.data ?? [],
    snapshots: snapshots.data ?? [],
    notificationPreferences: notificationPreferences.data,
    notificationReads: notificationReads.data ?? []
  };
}
