import Link from "next/link";
import { createCategory, signOut, switchHousehold } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Field } from "@/components/form-fields";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireHousehold } from "@/lib/data";
import { APP_VERSION, getBuildLabel } from "@/lib/version";

const sections = [
  {
    title: "Household",
    links: [
      { href: "/onboarding/invite", label: "Invite spouse", detail: "Add your wife to this household" },
      { href: "/feed", label: "Household feed", detail: "Shared money activity" },
      { href: "/meeting", label: "Monthly meeting", detail: "Review the month together" },
      { href: "/goals", label: "Shared goals", detail: "Vacation, savings, and milestones" }
    ]
  },
  {
    title: "Finance",
    links: [
      { href: "/accounts", label: "Accounts", detail: "Checking, savings, cards, loans" },
      { href: "/recurring", label: "Bills", detail: "Recurring income and expenses" },
      { href: "/wealth", label: "Wealth", detail: "Net worth and milestones" },
      { href: "/notifications", label: "Updates", detail: "Briefs, alerts, and push settings" }
    ]
  },
  {
    title: "Personal",
    links: [
      { href: "/profile", label: "Profile", detail: "Your account details" }
    ]
  }
];

export default async function SettingsPage() {
  const { supabase, householdId, householdName, memberships } = await requireHousehold();
  const [{ data: categories }, { data: members }] = await Promise.all([
    supabase.from("categories").select("*").eq("household_id", householdId).order("kind").order("name"),
    supabase.from("household_members").select("role, profiles(full_name, email)").eq("household_id", householdId)
  ]);

  return (
    <AppShell title="More">
      <section className="ios-card p-4">
        <p className="text-sm text-app-muted">Household</p>
        <p className="mt-1 text-xl font-bold text-app-text">{householdName}</p>
        {memberships.length > 1 ? (
          <form action={switchHousehold} className="mt-4 grid gap-2">
            <label className="text-sm font-semibold text-app-muted" htmlFor="household_id">
              Active household
            </label>
            <select className="ios-input" id="household_id" name="household_id" defaultValue={householdId}>
              {memberships.map((membership) => {
                const household = Array.isArray(membership.households)
                  ? membership.households[0]
                  : membership.households;
                return (
                  <option key={membership.household_id} value={membership.household_id}>
                    {household?.name ?? "Household"} ({membership.role})
                  </option>
                );
              })}
            </select>
            <button className="ios-secondary-button min-h-11" type="submit">
              Switch household
            </button>
          </form>
        ) : null}
      </section>

      <section className="mt-5 grid gap-3">
        <ThemeToggle />
      </section>

      {sections.map((section) => (
        <section key={section.title} className="mt-5">
          <h2 className="mb-3 px-1 text-sm font-bold uppercase tracking-[.16em] text-app-muted">{section.title}</h2>
          <div className="ios-card overflow-hidden">
            {section.links.map((item, index) => (
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
      ))}

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

      <form action={createCategory} className="ios-card mt-5 grid gap-4 p-4">
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

      <form action={signOut} className="mt-5">
        <button className="ios-secondary-button w-full text-app-danger" type="submit">Sign out</button>
      </form>

      <section className="mt-5 text-center text-xs text-app-muted">
        <p>Household Finance v{APP_VERSION}</p>
        <p className="mt-1">Build {getBuildLabel()}</p>
      </section>
    </AppShell>
  );
}
