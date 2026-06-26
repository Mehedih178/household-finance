import { NextResponse } from "next/server";
import { monthRange, previousMonthKey } from "@/lib/budgeting";
import { generateFinanceInbox, defaultNotificationPreferences } from "@/lib/finance-inbox";
import { configureWebPush, toWebPushSubscription } from "@/lib/push";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { monthKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PushSubscriptionRow = Database["public"]["Tables"]["push_subscriptions"]["Row"];

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (cronSecret && authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const push = configureWebPush();
  const currentMonth = monthRange(monthKey());
  const previousMonth = monthRange(previousMonthKey(monthKey()));

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let sent = 0;
  let failed = 0;
  const today = new Date();
  const weekday = today.getUTCDay();

  for (const subscription of (subscriptions ?? []) as PushSubscriptionRow[]) {
    const [
      { data: preferences },
      { data: budgets },
      { data: currentTransactions },
      { data: previousTransactions },
      { data: goals },
      { data: contributions },
      { data: recurring },
      { data: accounts },
      { data: snapshots }
    ] = await Promise.all([
      supabase
        .from("notification_preferences")
        .select("*")
        .eq("household_id", subscription.household_id)
        .eq("user_id", subscription.user_id)
        .maybeSingle(),
      supabase.from("budgets").select("*, categories(name)").eq("household_id", subscription.household_id).eq("month", currentMonth.start),
      supabase
        .from("transactions")
        .select("*, categories(name), profiles!transactions_created_by_fkey(full_name, email)")
        .eq("household_id", subscription.household_id)
        .gte("occurred_on", currentMonth.start)
        .lt("occurred_on", currentMonth.end),
      supabase
        .from("transactions")
        .select("*, categories(name), profiles!transactions_created_by_fkey(full_name, email)")
        .eq("household_id", subscription.household_id)
        .gte("occurred_on", previousMonth.start)
        .lt("occurred_on", previousMonth.end),
      supabase.from("goals").select("*").eq("household_id", subscription.household_id),
      supabase.from("goal_contributions").select("*, profiles(full_name, email)").eq("household_id", subscription.household_id),
      supabase.from("recurring_items").select("*").eq("household_id", subscription.household_id).order("next_due_on"),
      supabase.from("accounts").select("*").eq("household_id", subscription.household_id),
      supabase.from("net_worth_snapshots").select("*").eq("household_id", subscription.household_id).order("snapshot_on", { ascending: false }).limit(6)
    ]);

    const resolvedPreferences = preferences ?? defaultNotificationPreferences;
    const shouldSend =
      resolvedPreferences.frequency === "weekly"
        ? weekday === 0
        : true;

    if (!shouldSend) {
      continue;
    }

    const inbox = generateFinanceInbox({
      accounts: accounts ?? [],
      budgets: budgets ?? [],
      contributions: contributions ?? [],
      currentMonthTransactions: currentTransactions ?? [],
      goals: goals ?? [],
      previousMonthTransactions: previousTransactions ?? [],
      preferences: resolvedPreferences,
      recurring: recurring ?? [],
      snapshots: snapshots ?? [],
      userId: subscription.user_id
    });
    const topItem = inbox.items[0];
    const payload = JSON.stringify({
      title: topItem ? topItem.title : "Morning financial brief",
      body: topItem ? topItem.detail : inbox.brief.tip,
      tag: topItem?.id ?? "finance-digest",
      url: topItem?.href ?? "/dashboard"
    });

    try {
      await push.sendNotification(toWebPushSubscription(subscription), payload);
      sent += 1;
    } catch (sendError) {
      failed += 1;
      const statusCode = typeof sendError === "object" && sendError && "statusCode" in sendError
        ? Number(sendError.statusCode)
        : 0;
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
      }
    }
  }

  return NextResponse.json({ failed, sent });
}
