import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ProgressBar } from "@/components/progress-bar";
import { monthRange } from "@/lib/budgeting";
import { requireHousehold } from "@/lib/data";
import { formatCurrency, monthKey } from "@/lib/utils";

export default async function MeetingPage() {
  const { supabase, householdId, householdName } = await requireHousehold();
  const month = monthRange(monthKey());
  const [{ data: transactions }, { data: goals }, { data: contributions }, { data: notes }] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, categories(name)")
      .eq("household_id", householdId)
      .gte("occurred_on", month.start)
      .lt("occurred_on", month.end),
    supabase.from("goals").select("*").eq("household_id", householdId).order("created_at", { ascending: false }),
    supabase.from("goal_contributions").select("*").eq("household_id", householdId),
    supabase
      .from("financial_notes")
      .select("*, profiles!financial_notes_created_by_fkey(full_name, email)")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false })
      .limit(4)
  ]);

  const income = (transactions ?? []).filter((item) => item.kind === "income").reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = (transactions ?? []).filter((item) => item.kind === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
  const savings = income - expenses;
  const bigPurchases = (transactions ?? [])
    .filter((item) => item.kind === "expense")
    .sort((first, second) => Number(second.amount) - Number(first.amount))
    .slice(0, 5);

  return (
    <AppShell title="Meeting" backHref="/settings">
      <section className="rounded-[30px] bg-app-tint p-5 text-white shadow-ios">
        <p className="text-sm font-semibold opacity-80">This month</p>
        <p className="mt-2 text-3xl font-bold tracking-tight">{householdName} review</p>
        <p className="mt-2 text-sm opacity-85">Income, spending, savings, goals, and big purchases.</p>
      </section>

      <section className="mt-5 grid grid-cols-3 gap-2">
        <div className="ios-card p-3">
          <p className="text-xs text-app-muted">Income</p>
          <p className="mt-1 font-bold text-app-success">{formatCurrency(income)}</p>
        </div>
        <div className="ios-card p-3">
          <p className="text-xs text-app-muted">Expenses</p>
          <p className="mt-1 font-bold text-app-danger">{formatCurrency(expenses)}</p>
        </div>
        <div className="ios-card p-3">
          <p className="text-xs text-app-muted">Savings</p>
          <p className="mt-1 font-bold text-app-text">{formatCurrency(savings)}</p>
        </div>
      </section>

      <section className="ios-card mt-5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-app-text">Goals progress</h2>
          <Link href="/goals" className="text-sm font-semibold text-app-tint">Manage</Link>
        </div>
        <div className="grid gap-4">
          {(goals ?? []).slice(0, 4).map((goal) => {
            const saved = (contributions ?? [])
              .filter((item) => item.goal_id === goal.id)
              .reduce((sum, item) => sum + Number(item.amount), 0);
            const percent = Number(goal.target_amount) ? (saved / Number(goal.target_amount)) * 100 : 0;
            return (
              <div key={goal.id}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-semibold text-app-text">{goal.name}</span>
                  <span className="text-app-muted">{formatCurrency(saved)} / {formatCurrency(Number(goal.target_amount))}</span>
                </div>
                <ProgressBar value={percent} />
              </div>
            );
          })}
          {goals?.length === 0 ? <p className="text-sm text-app-muted">No goals yet.</p> : null}
        </div>
      </section>

      <section className="ios-card mt-5 p-4">
        <h2 className="text-lg font-bold text-app-text">Big purchases</h2>
        <div className="mt-3 grid gap-2">
          {bigPurchases.map((transaction) => (
            <Link key={transaction.id} href={`/transactions/${transaction.id}/edit`} className="flex items-center justify-between rounded-2xl bg-app-bg px-3 py-2">
              <span className="min-w-0 truncate font-medium text-app-text">{transaction.description}</span>
              <span className="font-bold text-app-text">{formatCurrency(Number(transaction.amount))}</span>
            </Link>
          ))}
          {bigPurchases.length === 0 ? <p className="text-sm text-app-muted">No large expenses this month.</p> : null}
        </div>
      </section>

      <section className="ios-card mt-5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-app-text">Discussion notes</h2>
          <Link href="/feed" className="text-sm font-semibold text-app-tint">Feed</Link>
        </div>
        <div className="grid gap-2">
          {(notes ?? []).map((note) => (
            <p key={note.id} className="rounded-2xl bg-app-bg p-3 text-sm text-app-muted">“{note.body}”</p>
          ))}
          {notes?.length === 0 ? <p className="text-sm text-app-muted">Add notes from the household feed, goals, accounts, or transaction details.</p> : null}
        </div>
      </section>
    </AppShell>
  );
}
