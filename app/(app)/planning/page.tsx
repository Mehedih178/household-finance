import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ProgressBar } from "@/components/progress-bar";
import { monthRange } from "@/lib/budgeting";
import { requireHousehold } from "@/lib/data";
import { formatCurrency, formatShortDate, monthKey } from "@/lib/utils";

export default async function PlanningPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  const { supabase, householdId } = await requireHousehold();
  const month = monthRange(monthKey());
  const [{ data: budgets }, { data: transactions }, { data: goals }, { data: contributions }, { data: recurring }] = await Promise.all([
    supabase.from("budgets").select("*, categories(name)").eq("household_id", householdId).eq("month", month.start),
    supabase.from("transactions").select("*").eq("household_id", householdId).gte("occurred_on", month.start).lt("occurred_on", month.end),
    supabase.from("goals").select("*").eq("household_id", householdId).order("created_at", { ascending: false }),
    supabase.from("goal_contributions").select("*").eq("household_id", householdId),
    supabase.from("recurring_items").select("*").eq("household_id", householdId).order("next_due_on")
  ]);

  const spent = (transactions ?? [])
    .filter((transaction) => transaction.kind === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const budgeted = (budgets ?? []).reduce((sum, budget) => sum + Number(budget.amount), 0);
  const budgetPercent = budgeted ? (spent / budgeted) * 100 : 0;
  const available = budgeted - spent;
  const recurringBills = (recurring ?? []).filter((item) => item.kind === "expense");
  const topGoal = (goals ?? []).map((goal) => {
    const saved = (contributions ?? [])
      .filter((contribution) => contribution.goal_id === goal.id)
      .reduce((sum, contribution) => sum + Number(contribution.amount), 0);
    return {
      ...goal,
      percent: Number(goal.target_amount) ? Math.round((saved / Number(goal.target_amount)) * 100) : 0,
      saved
    };
  }).sort((first, second) => second.percent - first.percent)[0];
  const nextBill = recurringBills[0];
  const monthLabel = new Date(`${month.start}T00:00:00`).toLocaleDateString("en-US", { month: "long" });
  const budgetRows = (budgets ?? []).map((budget) => {
    const categorySpent = (transactions ?? [])
      .filter((transaction) => transaction.kind === "expense" && transaction.category_id === budget.category_id)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    const amount = Number(budget.amount);
    const percent = amount > 0 ? Math.min(100, Math.max(0, (categorySpent / amount) * 100)) : 0;
    return {
      id: budget.id,
      name: budget.categories?.name ?? "Budget",
      amount,
      spent: categorySpent,
      percent
    };
  }).sort((first, second) => second.spent - first.spent);

  return (
    <AppShell title="Budget">
      {searchParams?.error ? (
        <div className="mb-4 rounded-2xl border border-app-danger/30 bg-app-danger/10 p-4 text-sm text-app-danger">
          {searchParams.error}
        </div>
      ) : null}

      <section className="rounded-[30px] bg-app-card p-5 shadow-ios-sm">
        <p className="text-sm font-semibold text-app-muted">{monthLabel}</p>
        <p className="mt-1 text-sm text-app-muted">Available</p>
        <p className="mt-2 text-4xl font-bold tracking-tight text-app-text">
          {budgeted ? formatCurrency(available) : "Set your monthly plan"}
        </p>
        <div className="mt-5">
          <ProgressBar value={budgetPercent} />
        </div>
        <p className="mt-3 text-sm text-app-muted">
          Budget progress {Math.round(budgetPercent)}% · {formatCurrency(spent)} spent
        </p>
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-app-text">Budget categories</h2>
          <Link href="/budgets" className="text-sm font-semibold text-app-tint">Manage</Link>
        </div>
        <div className="grid gap-3">
          {budgetRows.length > 0 ? budgetRows.map((budget) => (
            <div key={budget.id} className="ios-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-app-text">{budget.name}</p>
                  <p className="mt-1 text-sm text-app-muted">{formatCurrency(budget.spent)} of {formatCurrency(budget.amount)}</p>
                </div>
                <p className="text-sm font-semibold text-app-muted">{Math.round(budget.percent)}%</p>
              </div>
              <div className="mt-3">
                <ProgressBar value={budget.percent} />
              </div>
            </div>
          )) : (
            <Link href="/budgets" className="ios-card block p-5 text-center font-semibold text-app-tint">Create your first budget</Link>
          )}
        </div>
      </section>

      <section className="mt-5">
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="ios-card p-4">
            <p className="text-sm text-app-muted">Next bill</p>
            <p className="mt-2 font-bold text-app-text">{nextBill ? nextBill.description : "All clear"}</p>
            <p className="mt-1 text-sm text-app-muted">
              {nextBill ? `${formatCurrency(Number(nextBill.amount))} · ${formatShortDate(nextBill.next_due_on)}` : "Nothing due soon"}
            </p>
          </div>
          <div className="ios-card p-4">
            <p className="text-sm text-app-muted">Monthly status</p>
            <p className="mt-2 font-bold text-app-text">{available >= 0 ? "On track" : "Over plan"}</p>
            <p className="mt-1 text-sm text-app-muted">{formatCurrency(available)} available</p>
          </div>
        </div>
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-app-text">Recurring bills</h2>
          <Link href="/recurring" className="text-sm font-semibold text-app-tint">Manage</Link>
        </div>
        <div className="grid gap-3">
          {recurringBills.length ? recurringBills.slice(0, 3).map((item) => (
            <Link key={item.id} href="/recurring" className="ios-card flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-bold text-app-text">{item.description}</p>
                <p className="mt-1 text-sm text-app-muted">{formatShortDate(item.next_due_on)} · {item.frequency}</p>
              </div>
              <p className="font-bold text-app-text">-{formatCurrency(Number(item.amount))}</p>
            </Link>
          )) : (
            <Link href="/recurring" className="ios-card block p-5 text-center font-semibold text-app-tint">Add recurring bills</Link>
          )}
        </div>
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-app-text">Goals</h2>
          <Link href="/goals" className="text-sm font-semibold text-app-tint">Manage</Link>
        </div>
        {topGoal ? (
          <Link href="/goals" className="ios-card block p-5">
            <p className="text-3xl">{topGoal.name.toLowerCase().includes("trip") || topGoal.name.toLowerCase().includes("japan") ? "🏖️" : "🎯"}</p>
            <p className="mt-3 text-2xl font-bold tracking-tight text-app-text">{topGoal.name}</p>
            <p className="mt-1 text-sm text-app-muted">{formatCurrency(topGoal.saved)} saved</p>
            <div className="mt-4">
              <ProgressBar value={topGoal.percent} />
            </div>
            <p className="mt-3 text-sm text-app-muted">{topGoal.percent}% funded</p>
          </Link>
        ) : (
          <Link href="/goals" className="ios-card block p-5 text-center font-semibold text-app-tint">Create a shared goal</Link>
        )}
      </section>
    </AppShell>
  );
}
