import Link from "next/link";
import { markAllNotificationsRead, markNotificationRead, saveNotificationPreferences } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Field } from "@/components/form-fields";
import { PushNotificationControls } from "@/components/push-notification-controls";
import { monthRange, previousMonthKey } from "@/lib/budgeting";
import { requireHousehold } from "@/lib/data";
import { defaultNotificationPreferences, generateFinanceInbox, type FinanceInboxItem } from "@/lib/finance-inbox";
import { getVapidPublicKey } from "@/lib/push";
import { formatCurrency, formatShortDate, monthKey } from "@/lib/utils";

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
    { data: preferencesRow },
    { data: reads }
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
      .maybeSingle(),
    supabase
      .from("notification_reads")
      .select("notification_id")
      .eq("household_id", householdId)
      .eq("user_id", user.id)
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
  const readIds = new Set((reads ?? []).map((read) => read.notification_id));
  const unreadItems = inbox.items.filter((item) => !readIds.has(item.id)).slice(0, 30);
  const readItems = inbox.items.filter((item) => readIds.has(item.id)).slice(0, 12);
  const priorityItems = unreadItems.filter((item) => item.severity === "danger" || item.severity === "warning").slice(0, 4);
  const insightItems = unreadItems.filter((item) => item.category === "insights").slice(0, 4);
  const celebrationItems = unreadItems.filter((item) => item.severity === "good" || item.category === "achievements").slice(0, 4);
  const upcomingBill = (recurring ?? [])[0];
  const goalProgress = (goals ?? [])
    .map((goal) => {
      const saved = (contributions ?? [])
        .filter((contribution) => contribution.goal_id === goal.id)
        .reduce((sum, contribution) => sum + Number(contribution.amount), 0);
      const percent = Number(goal.target_amount) > 0 ? Math.round((saved / Number(goal.target_amount)) * 100) : 0;
      return { ...goal, percent, saved };
    })
    .sort((first, second) => first.percent - second.percent)[0];

  return (
    <AppShell title="Briefing" backHref="/settings">
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

      <section className="ios-card p-5">
        <p className="text-lg font-medium text-app-muted">Good morning</p>
        <p className="mt-2 text-3xl font-extrabold tracking-tight text-app-text">
          {priorityItems.length > 0 ? "A few things need attention." : "Your household is on track."}
        </p>
        <div className="mt-5 grid gap-2 text-sm">
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
          <div className="flex justify-between rounded-2xl bg-app-bg px-3 py-2">
            <span className="text-app-muted">Next bill</span>
            <span className="text-right font-bold text-app-text">
              {upcomingBill ? `${upcomingBill.description} ${formatShortDate(upcomingBill.next_due_on)}` : "Nothing due soon"}
            </span>
          </div>
        </div>
        <p className="mt-4 rounded-2xl bg-app-tint/10 p-3 text-sm font-semibold text-app-tint">{inbox.brief.tip}</p>
      </section>

      {goalProgress ? (
        <section className="ios-card mt-5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-app-text">{goalProgress.name}</h2>
              <p className="mt-1 text-sm text-app-muted">{formatCurrency(goalProgress.saved)} saved toward this goal.</p>
            </div>
            <p className="rounded-full bg-app-bg px-3 py-1 text-sm font-bold text-app-tint">{goalProgress.percent}%</p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-app-bg">
            <div className="h-full rounded-full bg-app-tint" style={{ width: `${Math.min(100, Math.max(0, goalProgress.percent))}%` }} />
          </div>
        </section>
      ) : null}

      <InboxSection title="Action needed" items={priorityItems} empty="No urgent finance alerts right now." />
      <InboxSection title="Recent wins" items={celebrationItems} empty="Wins and achievements will appear here." />
      <InboxSection title="Insights" items={insightItems} empty="More insights appear as you add transactions." />

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-app-text">New</h2>
          {unreadItems.length > 0 ? (
            <form action={markAllNotificationsRead}>
              {unreadItems.map((item) => <input key={item.id} type="hidden" name="notification_id" value={item.id} />)}
              <button className="text-sm font-semibold text-app-tint" type="submit">Mark all read</button>
            </form>
          ) : null}
        </div>
        <div className="grid gap-3">
          {unreadItems.length > 0 ? unreadItems.map((item) => <InboxCard key={item.id} item={item} read={false} />) : (
            <div className="ios-card p-4 text-sm text-app-muted">No new updates.</div>
          )}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="mb-3 text-lg font-bold text-app-text">Seen</h2>
        <div className="grid gap-3">
          {readItems.length > 0 ? readItems.map((item) => <InboxCard key={item.id} item={item} read />) : (
            <div className="ios-card p-4 text-sm text-app-muted">Seen updates will appear here.</div>
          )}
        </div>
      </section>

      <form action={saveNotificationPreferences} className="ios-card mt-5 grid gap-4 p-4">
        <div>
          <h2 className="text-lg font-bold text-app-text">Update controls</h2>
          <p className="mt-1 text-sm text-app-muted">Choose what your finance assistant should watch.</p>
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
        <button className="ios-button" type="submit">Save updates</button>
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
        {items.length > 0 ? items.map((item) => <InboxCard key={item.id} item={item} read={false} />) : (
          <div className="ios-card p-4 text-sm text-app-muted">{empty}</div>
        )}
      </div>
    </section>
  );
}

function InboxCard({ item, read }: { item: FinanceInboxItem; read: boolean }) {
  return (
    <div className={`rounded-ios border p-4 shadow-ios-sm ${read ? "border-app-line/60 bg-app-card/60 opacity-75" : toneClasses(item.severity)}`}>
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-app-bg text-xl">{item.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-app-text">{item.title}</p>
            <span className="rounded-full bg-app-bg px-2 py-1 text-[11px] font-bold capitalize text-app-muted">{item.category}</span>
          </div>
          <p className="mt-1 text-sm leading-5 text-app-muted">{item.detail}</p>
          <div className="mt-3 flex items-center gap-3">
            <Link href={item.href} className="text-sm font-semibold text-app-tint">Open</Link>
            {!read ? (
              <form action={markNotificationRead}>
                <input type="hidden" name="notification_id" value={item.id} />
                <input type="hidden" name="next" value="/notifications" />
                <button className="text-sm font-semibold text-app-muted" type="submit">Mark read</button>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </div>
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
