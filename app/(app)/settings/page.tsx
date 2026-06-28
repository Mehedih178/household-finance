import Link from "next/link";
import { createCategory, deleteCategory, saveNotificationPreferences, signOut, updateCategory, updateHouseholdName } from "@/app/actions";
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
    <AppShell title="More">
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
        <h2 className="mb-3 px-1 text-sm font-bold uppercase tracking-[.16em] text-app-muted">Money</h2>
        <div className="ios-card overflow-hidden">
          {[
            { href: "/accounts", label: "Accounts", detail: "Bank accounts, cards, and debt" },
            { href: "/planning", label: "Budget", detail: "Monthly plan and category limits" },
            { href: "/recurring", label: "Recurring bills", detail: "Subscriptions and repeating bills" }
          ].map((item, index) => (
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
          <h2 className="text-lg font-bold text-app-text">Reminders</h2>
          <p className="mt-1 text-sm text-app-muted">Choose how often the app should remind you, then enable push on this iPhone.</p>
        </div>
        <form action={saveNotificationPreferences} className="grid gap-4">
          <Field label="Reminder schedule">
            <select className="ios-input" name="frequency" defaultValue={preferences.frequency}>
              <option value="daily">Daily brief</option>
              <option value="weekly">Weekly recap</option>
              <option value="instant">As often as possible</option>
            </select>
          </Field>
          <input type="hidden" name="budget_alerts" value={preferences.budget_alerts ? "on" : ""} />
          <input type="hidden" name="bills" value={preferences.bills ? "on" : ""} />
          <input type="hidden" name="goals" value={preferences.goals ? "on" : ""} />
          <input type="hidden" name="household_activity" value={preferences.household_activity ? "on" : ""} />
          <input type="hidden" name="insights" value={preferences.insights ? "on" : ""} />
          <input type="hidden" name="achievements" value={preferences.achievements ? "on" : ""} />
          <input type="hidden" name="recurring_transactions" value={preferences.recurring_transactions ? "on" : ""} />
          <button className="ios-button" type="submit">Save reminders</button>
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

      <section className="mt-5 grid gap-3">
        <h2 className="px-1 text-sm font-bold uppercase tracking-[.16em] text-app-muted">Edit categories</h2>
        {categories?.map((category) => (
          <form key={category.id} action={updateCategory} className="ios-card grid gap-3 p-4">
            <input type="hidden" name="id" value={category.id} />
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <input className="ios-input" name="name" defaultValue={category.name} required />
              <select className="ios-input min-w-[112px]" name="kind" defaultValue={category.kind}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="flex items-center justify-between gap-3">
              <input className="ios-input h-12 w-20 p-1" name="color" type="color" defaultValue={category.color} />
              <div className="flex items-center gap-3">
                <button className="ios-secondary-button min-h-10 px-4 text-sm" type="submit">Save</button>
                <button className="min-h-10 text-sm font-semibold text-app-danger" formAction={deleteCategory} type="submit">Delete</button>
              </div>
            </div>
          </form>
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
