import Link from "next/link";
import { createCategory, saveNotificationPreferences, signOut, updateHouseholdName } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Field } from "@/components/form-fields";
import { HouseholdSiteSwitcher } from "@/components/household-site-switcher";
import { PendingInvites } from "@/components/pending-invites";
import { PushNotificationControls } from "@/components/push-notification-controls";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireHousehold } from "@/lib/data";
import { defaultNotificationPreferences } from "@/lib/finance-inbox";
import { getVapidPublicKey } from "@/lib/push";
import { APP_VERSION, getBuildLabel } from "@/lib/version";

const sections = [
  { href: "/settings#household", label: "Household", detail: "Name, members, and invites" },
  { href: "/accounts", label: "Accounts", detail: "Checking, savings, cards, and cash" },
  { href: "/settings#categories", label: "Categories", detail: "The labels behind your monthly plan" },
  { href: "/recurring", label: "Recurring Bills", detail: "Subscriptions, paychecks, and due dates" },
  { href: "/settings#preferences", label: "Preferences", detail: "Theme, sign out, and app defaults" }
];

export default async function SettingsPage({
  searchParams
}: {
  searchParams?: { error?: string; message?: string; renamed?: string };
}) {
  const { supabase, user, householdId, householdName, memberships } = await requireHousehold();
  const [{ data: categories }, { data: members }, { data: notificationPreferences }] = await Promise.all([
    supabase.from("categories").select("*").eq("household_id", householdId).order("kind").order("name"),
    supabase.from("household_members").select("role, profiles(full_name, email)").eq("household_id", householdId),
    supabase.from("notification_preferences").select("*").eq("household_id", householdId).eq("user_id", user.id).maybeSingle()
  ]);
  const vapidPublicKey = getVapidPublicKey();
  const preferences = notificationPreferences ?? defaultNotificationPreferences;

  return (
    <AppShell title="Household">
      {searchParams?.error ? (
        <div className="mb-4 rounded-2xl border border-app-danger/30 bg-app-danger/10 p-4 text-sm text-app-danger">
          {searchParams.error}
        </div>
      ) : null}

      {searchParams?.renamed ? (
        <div className="mb-4 rounded-2xl border border-app-success/30 bg-app-success/10 p-4 text-sm font-semibold text-app-success">
          Household name updated.
        </div>
      ) : null}

      {searchParams?.message ? (
        <div className="mb-4 rounded-2xl border border-app-success/30 bg-app-success/10 p-4 text-sm font-semibold text-app-success">
          {searchParams.message}
        </div>
      ) : null}

      <PendingInvites />

      <section className="ios-card p-4" id="household">
        <p className="text-sm text-app-muted">Household</p>
        <p className="mt-1 text-xl font-bold text-app-text">{householdName}</p>
        <form action={updateHouseholdName} className="mt-4 grid gap-2">
          <label className="text-sm font-semibold text-app-muted" htmlFor="household-name">
            Rename household
          </label>
          <input className="ios-input" id="household-name" name="name" defaultValue={householdName} required />
          <button className="ios-secondary-button min-h-11" type="submit">
            Save name
          </button>
        </form>
      </section>

      <HouseholdSiteSwitcher activeHouseholdId={householdId} memberships={memberships} className="mt-5" />

      <section className="mt-5">
        <h2 className="mb-3 px-1 text-sm font-bold uppercase tracking-[.16em] text-app-muted">Money setup</h2>
        <div className="ios-card overflow-hidden">
          {sections.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-16 items-center justify-between gap-3 px-4 py-3 ${index > 0 ? "border-t border-app-line/10" : ""}`}
            >
              <div>
                <p className="font-semibold text-app-text">{item.label}</p>
                <p className="mt-1 text-sm text-app-muted">{item.detail}</p>
              </div>
              <span className="text-xl text-app-muted">›</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="ios-card mt-5 grid gap-4 p-4" id="reminders">
        <div>
          <h2 className="text-lg font-bold text-app-text">Daily reminders</h2>
          <p className="mt-1 text-sm text-app-muted">Keep reminder setup simple: choose when to hear from the app, then enable push on this iPhone.</p>
        </div>
        <form action={saveNotificationPreferences} className="grid gap-4">
          <Field label="Reminder schedule">
            <select className="ios-input" name="frequency" defaultValue={preferences.frequency}>
              <option value="daily">Daily brief</option>
              <option value="weekly">Weekly recap</option>
              <option value="instant">As often as possible</option>
            </select>
          </Field>
          <label className="flex items-center justify-between rounded-2xl bg-app-bg p-3 text-sm font-semibold text-app-text">
            <span>Budget alerts</span>
            <input name="budget_alerts" type="checkbox" defaultChecked={preferences.budget_alerts} className="h-5 w-5 accent-[rgb(var(--app-tint))]" />
          </label>
          <label className="flex items-center justify-between rounded-2xl bg-app-bg p-3 text-sm font-semibold text-app-text">
            <span>Bills and subscriptions</span>
            <input name="bills" type="checkbox" defaultChecked={preferences.bills} className="h-5 w-5 accent-[rgb(var(--app-tint))]" />
          </label>
          <label className="flex items-center justify-between rounded-2xl bg-app-bg p-3 text-sm font-semibold text-app-text">
            <span>Goals and milestones</span>
            <input name="goals" type="checkbox" defaultChecked={preferences.goals} className="h-5 w-5 accent-[rgb(var(--app-tint))]" />
          </label>
          <label className="flex items-center justify-between rounded-2xl bg-app-bg p-3 text-sm font-semibold text-app-text">
            <span>Household activity</span>
            <input name="household_activity" type="checkbox" defaultChecked={preferences.household_activity} className="h-5 w-5 accent-[rgb(var(--app-tint))]" />
          </label>
          <label className="flex items-center justify-between rounded-2xl bg-app-bg p-3 text-sm font-semibold text-app-text">
            <span>Insights and trends</span>
            <input name="insights" type="checkbox" defaultChecked={preferences.insights} className="h-5 w-5 accent-[rgb(var(--app-tint))]" />
          </label>
          <label className="flex items-center justify-between rounded-2xl bg-app-bg p-3 text-sm font-semibold text-app-text">
            <span>Achievements</span>
            <input name="achievements" type="checkbox" defaultChecked={preferences.achievements} className="h-5 w-5 accent-[rgb(var(--app-tint))]" />
          </label>
          <label className="flex items-center justify-between rounded-2xl bg-app-bg p-3 text-sm font-semibold text-app-text">
            <span>Recurring transactions</span>
            <input name="recurring_transactions" type="checkbox" defaultChecked={preferences.recurring_transactions} className="h-5 w-5 accent-[rgb(var(--app-tint))]" />
          </label>
          <button className="ios-button" type="submit">Save reminder preferences</button>
        </form>
      </section>

      <section className="ios-card mt-5 p-4">
        <h2 className="text-lg font-bold text-app-text">Members</h2>
        <div className="mt-3 grid gap-3">
          {members?.map((member, index) => {
            const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
            return (
              <div key={index} className="flex items-center justify-between">
                <p className="font-semibold text-app-text">{profile?.full_name ?? profile?.email}</p>
                <p className="text-sm capitalize text-app-muted">{member.role}</p>
              </div>
            );
          })}
        </div>
      </section>

      <form action={createCategory} className="ios-card mt-5 grid gap-4 p-4" id="categories">
        <h2 className="text-lg font-bold text-app-text">Add category</h2>
        <Field label="Name">
          <input className="ios-input" name="name" placeholder="Utilities" required />
        </Field>
        <Field label="Kind">
          <select className="ios-input" name="kind" defaultValue="expense">
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </Field>
        <Field label="Color">
          <input className="ios-input h-14" name="color" type="color" defaultValue="#007aff" />
        </Field>
        <input type="hidden" name="icon" value="circle" />
        <button className="ios-button" type="submit">Save category</button>
      </form>

      <section className="mt-5 grid gap-2">
        {categories?.map((category) => (
          <div key={category.id} className="flex items-center justify-between rounded-2xl bg-app-card px-4 py-3">
            <span className="font-medium text-app-text">{category.name}</span>
            <span className="text-sm capitalize text-app-muted">{category.kind}</span>
          </div>
        ))}
      </section>

      <section className="mt-5 grid gap-3" id="preferences">
        <PushNotificationControls publicKey={vapidPublicKey} />
        <ThemeToggle />
        <form action={signOut}>
          <button className="ios-secondary-button w-full text-app-danger" type="submit">Sign out</button>
        </form>
      </section>

      <section className="mt-5 text-center text-xs text-app-muted">
        <p>Daily Money Companion v{APP_VERSION}</p>
        <p className="mt-1">Build {getBuildLabel()}</p>
      </section>
    </AppShell>
  );
}
