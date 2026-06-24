import { createBudget } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Field, ToggleRow } from "@/components/form-fields";
import { ProgressRing } from "@/components/progress-ring";
import { budgetAlert, daysLeftInMonth, monthRange, previousMonthKey } from "@/lib/budgeting";
import { requireHousehold } from "@/lib/data";
import { formatCurrency, monthKey } from "@/lib/utils";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function BudgetsPage({
  searchParams
}: {
  searchParams?: { error?: string; month?: string; saved?: string };
}) {
  const month = searchParams?.month ?? monthKey();
  const { supabase, householdId } = await requireHousehold();
  const monthDates = monthRange(month);
  const previousMonth = previousMonthKey(month);
  const previousDates = monthRange(previousMonth);
  const daysLeft = daysLeftInMonth(month);
  const nextMonthDate = new Date(`${month}-01T00:00:00`);
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
  const nextMonth = nextMonthDate.toISOString().slice(0, 7);

  const [{ data: budgets }, { data: categories }, { data: transactions }, { data: previousBudgets }, { data: previousTransactions }] = await Promise.all([
    supabase.from("budgets").select("*, categories(name, color)").eq("household_id", householdId).eq("month", monthDates.start),
    supabase.from("categories").select("*").eq("household_id", householdId).eq("kind", "expense").order("name"),
    supabase.from("transactions").select("*").eq("household_id", householdId).eq("kind", "expense").gte("occurred_on", monthDates.start).lt("occurred_on", monthDates.end),
    supabase.from("budgets").select("*, categories(name, color)").eq("household_id", householdId).eq("month", previousDates.start),
    supabase.from("transactions").select("*").eq("household_id", householdId).eq("kind", "expense").gte("occurred_on", previousDates.start).lt("occurred_on", previousDates.end)
  ]);
  const starterEnvelopeNames = ["Groceries", "Date Nights", "Gas", "Vacation", "Fun Money"];
  const budgetRows = (budgets ?? []).map((budget) => {
    const spent = (transactions ?? [])
      .filter((transaction) => transaction.category_id === budget.category_id)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    const previousBudget = (previousBudgets ?? []).find((item) => item.category_id === budget.category_id);
    const previousSpent = (previousTransactions ?? [])
      .filter((transaction) => transaction.category_id === budget.category_id)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    const rollover = previousBudget
      ? Math.max(0, Number(previousBudget.amount) - previousSpent)
      : 0;
    const envelopeTotal = Number(budget.amount) + rollover;
    const remaining = envelopeTotal - spent;
    const percent = envelopeTotal ? (spent / envelopeTotal) * 100 : 0;
    const categoryName = budget.categories?.name ?? "Budget";
    const alert = budgetAlert({
      budgetAmount: envelopeTotal,
      categoryName,
      daysLeft,
      spent
    });

    return { alert, budget, categoryName, envelopeTotal, percent, remaining, rollover, spent };
  });
  const totalBudgeted = budgetRows.reduce((sum, row) => sum + row.envelopeTotal, 0);
  const totalSpent = budgetRows.reduce((sum, row) => sum + row.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;

  return (
    <AppShell
      title="Budgets"
      action={
        <a href="#add-budget" className="ios-button h-11 min-h-11 rounded-full px-4" aria-label="Add budget">
          <Plus size={20} />
        </a>
      }
    >
      {searchParams?.error ? (
        <div className="mb-4 rounded-2xl border border-app-danger/30 bg-app-danger/10 p-4 text-sm text-app-danger">
          {searchParams.error}
        </div>
      ) : null}

      {searchParams?.saved ? (
        <div className="mb-4 rounded-2xl border border-app-success/30 bg-app-success/10 p-4 text-sm font-semibold text-app-success">
          Budget saved.
        </div>
      ) : null}

      <section className="ios-card p-4">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/budgets?month=${previousMonth}`} className="ios-secondary-button min-h-10 px-3 text-sm">Prev</Link>
          <form className="min-w-0 flex-1">
            <input className="ios-input min-h-10 text-center text-sm font-bold" type="month" name="month" defaultValue={month} aria-label="Budget month" />
            <button className="ios-secondary-button mt-2 w-full min-h-10 text-sm" type="submit">Apply month</button>
          </form>
          <Link href={`/budgets?month=${nextMonth}`} className="ios-secondary-button min-h-10 px-3 text-sm">Next</Link>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-app-bg p-3">
            <p className="text-xs text-app-muted">Budgeted</p>
            <p className="mt-1 font-bold text-app-text">{formatCurrency(totalBudgeted)}</p>
          </div>
          <div className="rounded-2xl bg-app-bg p-3">
            <p className="text-xs text-app-muted">Spent</p>
            <p className="mt-1 font-bold text-app-danger">{formatCurrency(totalSpent)}</p>
          </div>
          <div className="rounded-2xl bg-app-bg p-3">
            <p className="text-xs text-app-muted">Left</p>
            <p className={totalRemaining >= 0 ? "mt-1 font-bold text-app-success" : "mt-1 font-bold text-app-danger"}>{formatCurrency(totalRemaining)}</p>
          </div>
        </div>
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-app-text">Monthly envelopes</h2>
          <a href="#add-budget" className="text-sm font-semibold text-app-tint">Add</a>
        </div>
        <div className="grid gap-3">
        {budgetRows.map(({ alert, budget, categoryName, envelopeTotal, percent, remaining, rollover, spent }) => {
          return (
            <div key={budget.id} className="ios-card p-4">
              <div className="flex items-center gap-4">
                <ProgressRing
                  color={budget.categories?.color ?? "#007aff"}
                  label={`${categoryName} envelope progress`}
                  value={percent}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-app-text">{categoryName}</p>
                      <p className={remaining >= 0 ? "mt-1 text-2xl font-bold text-app-text" : "mt-1 text-2xl font-bold text-app-danger"}>
                        {formatCurrency(remaining)}
                      </p>
                    </div>
                    <p className="text-right text-sm text-app-muted">
                      {formatCurrency(spent)} / {formatCurrency(envelopeTotal)}
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-app-muted">
                    <span>Budget {formatCurrency(Number(budget.amount))}</span>
                    <span>Rollover {formatCurrency(rollover)}</span>
                  </div>
                </div>
              </div>
              {alert ? (
                <div className="mt-4 rounded-2xl border border-app-danger/20 bg-app-danger/10 p-3 text-sm font-medium text-app-danger">
                  {alert}
                </div>
              ) : null}
            </div>
          );
        })}
        {budgets?.length === 0 ? (
          <div className="ios-card p-5 text-center">
            <p className="font-semibold text-app-text">No budgets for this month</p>
            <p className="mt-1 text-sm text-app-muted">Tap the plus button to create your first envelope.</p>
          </div>
        ) : null}
        </div>
      </section>

      <details id="add-budget" className="ios-card mt-5 scroll-mt-28 p-4" open={budgetRows.length === 0}>
        <summary className="cursor-pointer list-none text-lg font-bold text-app-text">Add budget</summary>
        <form action={createBudget} className="mt-4 grid min-w-0 gap-4">
          <p className="text-sm text-app-muted">Use categories like {starterEnvelopeNames.join(", ")}.</p>
          <Field label="Category">
            <select className="ios-input" name="category_id" required disabled={(categories ?? []).length === 0}>
              {(categories ?? []).length === 0 ? <option value="">Add an expense category first</option> : null}
              {categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </Field>
          <input type="hidden" name="month" value={month} />
          <Field label="Monthly amount">
            <input className="ios-input" name="amount" type="number" min="0" step="0.01" inputMode="decimal" placeholder="800" required />
          </Field>
          <ToggleRow name="is_shared" label="Shared budget" description="Visible to both household members." />
          <button className="ios-button disabled:opacity-50" type="submit" disabled={(categories ?? []).length === 0}>Save budget</button>
        </form>
      </details>
    </AppShell>
  );
}
