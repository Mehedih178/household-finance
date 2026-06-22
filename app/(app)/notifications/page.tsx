import Link from "next/link";
import { saveNotificationPreferences } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Field } from "@/components/form-fields";
import { PushNotificationControls } from "@/components/push-notification-controls";
import { monthRange, previousMonthKey } from "@/lib/budgeting";
import { requireHousehold } from "@/lib/data";
import { defaultNotificationPreferences, generateFinanceInbox, type FinanceInboxItem } from "@/lib/finance-inbox";
import { getVapidPublicKey } from "@/lib/push";
import { formatCurrency, monthKey } from "@/lib/utils";

function toneClasses(severity: FinanceInboxItem["severity"]) {
  if (severity === "danger") return "border-app-danger/30 bg-app-danger/10";
  if (severity === "warning") return "border-[#ff9500]/30 bg-[#ff9500]/10";
  if (severity === "good") return "border-app-success/30 bg-app-success/10";
  return "border-app-line/70 bg-app-card";
}

function preferenceValue(preferences: typeof defaultNotificationPreferences, key: keyof typeof defaultNotificationPreferences) {
  return Boolean(preferences[key]);
}

export default async function NotificationsPage({
  searchParams
}: {
  searchParams?: { error?: string; message?: string };
}) {
  const { supabase, householdId, user } = await requireHousehold();
  const currentMonth = monthRange(monthKey());
  const previousMonth = monthRange(previousMonthKey(monthKey()));

  const [
    { data: budgets },
    { data: currentTransactions },
    { data: previousTransactions },
    { data: goals },
    { data: contributions },
    { data: recurring },
    { data: accounts },
    { data: snapshots },
    { data: preferencesRow }
  ] = await Promise.all([
    supabase.from("budgets").select("*, categories(name)").eq("household_id", householdId).eq("month", currentMonth.start),
    supabase
      .from("transactions")
      .select("*, categories(name), profiles!transactions_created_by_fkey(full_name, email)")
      .eq("household_id", householdId)
      .gte("occurred_on", currentMonth.start)
      .lt("occurred_on", currentMonth.end),
    supabase
      .from("transactions")
      .select("*, categories(name), profiles!transactions_created_by_fkey(full_name, email)")
      .eq("household_id", householdId)
      .gte("occurred_on", previousMonth.start)
      .lt("occurred_on", previousMonth.end),
    supabase.from("goals").select("*").eq("household_id", householdId),
    supabase.from("goal_contributions").select("*, profiles(full_name, email)").eq("household_id", householdId),
    supabase.from("recurring_items").select("*").eq("household_id", householdId).order("next_due_on"),
    supabase.from("accounts").select("*").eq("household_id", householdId).order("name"),
    supabase.from("net_worth_snapshots").select("*").eq("household_id", householdId).order("snapshot_on", { ascending: false }).limit(6),
    supabase
      .from("notification_preferences")
      .select("*")
      .eq("household_id", householdId)
      .eq("user_id", user.id)
      .maybeSingle()
  ]);

  const preferences = preferencesRow ?? defaultNotificationPreferences;
  const vapidPublicKey = getVapidPublicKey();
  const inbox = generateFinanceInbox({
    accounts: accounts ?? [],
    budgets: budgets ?? [],
    contributions: contributions ?? [],
    currentMonthTransactions: currentTransactions ?? [],
    goals: goals ?? [],
    previousMonthTransactions: previousTransactions ?? [],
    preferences,
    recurring: recurring ?? [],
    snapshots: snapshots ?? [],
    userId: user.id
  });
  const priorityItems = inbox.items.filter((item) => item.severity === "danger" || item.severity === "warning").slice(0, 4);
  const insightItems = inbox.items.filter((item) => item.category === "insights").slice(0, 4);
  const celebrationItems = inbox.items.filter((item) => item.severity === "good" || item.category === "achievements").slice(0, 4);

  return (
    <AppShell title="Inbox" backHref="/settings">
      {searchParams?.error ? (
        <div className="mb-4 rounded-2xl border border-app-danger/30 bg-app-danger/10 p-4 text-sm text-app-danger">
          {searchParams.error}
        </div>
      ) : null}

      {searchParams?.message ? (
        <div className="mb-4 rounded-2xl border border-app-success/30 bg-app-success/10 p-4 text-sm font-semibold text-app-success">
          {searchParams.message}
        </div>
      ) : null}

      <section className="rounded-[30px] bg-app-tint p-5 text-white shadow-ios">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold opacity-80">Finance Inbox</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">Notifications ({inbox.unreadCount})</p>
          </div>
          <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-bold capitalize">{preferences.frequency}</span>
        </div>
        <p className="mt-3 text-sm leading-6 opacity-90">
          Smart alerts for budgets, goals, bills, achievements, household activity, and weekly summaries.
        </p>
      </section>

      <section className="ios-card mt-5 p-4">
        <h2 className="text-lg font-bold text-app-text">Morning financial brief</h2>
        <div className="mt-3 grid gap-2 text-sm">
          <div className="flex justify-between rounded-2xl bg-app-bg px-3 py-2">
            <span className="text-app-muted">Checking</span>
            <span className="font-bold text-app-text">{inbox.brief.checkingBalance === null ? "Add account" : formatCurrency(Number(inbox.brief.checkingBalance))}</span>
          </div>
          <div className="flex justify-between rounded-2xl bg-app-bg px-3 py-2">
            <span className="text-app-muted">Remaining budget</span>
            <span className="font-bold text-app-text">{formatCurrency(inbox.brief.remainingBudget)}</span>
          </div>
          <div className="flex justify-between rounded-2xl bg-app-bg px-3 py-2">
            <span className="text-app-muted">Goals</span>
            <span className="font-bold text-app-text">{inbox.brief.goalLine}</span>
          </div>
        </div>
        <p className="mt-3 rounded-2xl bg-app-bg p-3 text-sm font-medium text-app-text">{inbox.brief.tip}</p>
      </section>

      <InboxSection title="Needs attention" items={priorityItems} empty="No urgent finance alerts right now." />
      <InboxSection title="Insights" items={insightItems} empty="More insights appear as you add transactions." />
      <InboxSection title="Wins" items={celebrationItems} empty="Achievements and streaks will appear here." />

      <section className="mt-5">
        <h2 className="mb-3 text-lg font-bold text-app-text">All notifications</h2>
        <div className="grid gap-3">
          {inbox.items.map((item) => <InboxCard key={item.id} item={item} />)}
        </div>
      </section>

      <form action={saveNotificationPreferences} className="ios-card mt-5 grid gap-4 p-4">
        <div>
          <h2 className="text-lg font-bold text-app-text">Notification controls</h2>
          <p className="mt-1 text-sm text-app-muted">Choose how the inbox prioritizes your finance assistant alerts.</p>
        </div>
        <Field label="Frequency">
          <select className="ios-input" name="frequency" defaultValue={preferences.frequency}>
            <option value="instant">Instant</option>
            <option value="daily">Daily digest</option>
            <option value="weekly">Weekly digest</option>
          </select>
        </Field>
        <div className="grid gap-2">
          <PreferenceToggle name="budget_alerts" label="Budget alerts" checked={preferenceValue(preferences, "budget_alerts")} />
          <PreferenceToggle name="bills" label="Bills" checked={preferenceValue(preferences, "bills")} />
          <PreferenceToggle name="goals" label="Goals" checked={preferenceValue(preferences, "goals")} />
          <PreferenceToggle name="achievements" label="Achievements" checked={preferenceValue(preferences, "achievements")} />
          <PreferenceToggle name="household_activity" label="Household activity" checked={preferenceValue(preferences, "household_activity")} />
          <PreferenceToggle name="insights" label="Insights" checked={preferenceValue(preferences, "insights")} />
          <PreferenceToggle name="recurring_transactions" label="Recurring transactions" checked={preferenceValue(preferences, "recurring_transactions")} />
        </div>
        <button className="ios-button" type="submit">Save controls</button>
      </form>

      <PushNotificationControls publicKey={vapidPublicKey} />
    </AppShell>
  );
}

function InboxSection({
  empty,
  items,
  title
}: {
  empty: string;
  items: FinanceInboxItem[];
  title: string;
}) {
  return (
    <section className="mt-5">
      <h2 className="mb-3 text-lg font-bold text-app-text">{title}</h2>
      <div className="grid gap-3">
        {items.length > 0 ? items.map((item) => <InboxCard key={item.id} item={item} />) : (
          <div className="ios-card p-4 text-sm text-app-muted">{empty}</div>
        )}
      </div>
    </section>
  );
}

function InboxCard({ item }: { item: FinanceInboxItem }) {
  return (
    <Link href={item.href} className={`block rounded-ios border p-4 shadow-ios-sm ${toneClasses(item.severity)}`}>
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-app-bg text-xl">{item.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-app-text">{item.title}</p>
            <span className="rounded-full bg-app-bg px-2 py-1 text-[11px] font-bold capitalize text-app-muted">{item.category}</span>
          </div>
          <p className="mt-1 text-sm leading-5 text-app-muted">{item.detail}</p>
        </div>
      </div>
    </Link>
  );
}

function PreferenceToggle({
  checked,
  label,
  name
}: {
  checked: boolean;
  label: string;
  name: string;
}) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-app-bg px-3 py-2">
      <span className="font-medium text-app-text">{label}</span>
      <input className="h-5 w-5 accent-app-tint" type="checkbox" name={name} defaultChecked={checked} />
    </label>
  );
}
