import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

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
  const monthStart = `${month}-01`;
  const nextMonth = new Date(`${monthStart}T00:00:00`);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const monthEnd = nextMonth.toISOString().slice(0, 10);

  const [transactions, categories, accounts, budgets, members] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, categories(name, color), accounts(name), profiles!transactions_created_by_fkey(full_name, email)")
      .eq("household_id", householdId)
      .gte("occurred_on", monthStart)
      .lt("occurred_on", monthEnd)
      .order("occurred_on", { ascending: false }),
    supabase.from("categories").select("*").eq("household_id", householdId).order("name"),
    supabase.from("accounts").select("*").eq("household_id", householdId).order("name"),
    supabase.from("budgets").select("*, categories(name, color)").eq("household_id", householdId).eq("month", monthStart),
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
    members: members.data ?? []
  };
}
