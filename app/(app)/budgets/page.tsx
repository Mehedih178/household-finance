import { createBudget } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Field, ToggleRow } from "@/components/form-fields";
import { ProgressRing } from "@/components/progress-ring";
import { budgetAlert, daysLeftInMonth, monthRange, previousMonthKey } from "@/lib/budgeting";
import { requireHousehold } from "@/lib/data";
import { formatCurrency, monthKey } from "@/lib/utils";

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

  const [{ data: budgets }, { data: categories }, { data: transactions }, { data: previousBudgets }, { data: previousTransactions }] = await Promise.all([
    supabase.from("budgets").select("*, categories(name, color)").eq("household_id", householdId).eq("month", monthDates.start),
    supabase.from("categories").select("*").eq("household_id", householdId).eq("kind", "expense").order("name"),
    supabase.from("transactions").select("*").eq("household_id", householdId).eq("kind", "expense").gte("occurred_on", monthDates.start).lt("occurred_on", monthDates.end),
    supabase.from("budgets").select("*, categories(name, color)").eq("household_id", householdId).eq("month", previousDates.start),
    supabase.from("transactions").select("*").eq("household_id", householdId).eq("kind", "expense").gte("occurred_on", previousDates.start).lt("occurred_on", previousDates.end)
  ]);
  const starterEnvelopeNames = ["Groceries", "Date Nights", "Gas", "Vacation", "Fun Money"];

  return (
    <AppShell title="Budgets">
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

      <form className="mb-4 min-w-0">
        <input className="ios-input" type="month" name="month" defaultValue={month} aria-label="Budget month" />
        <button className="ios-secondary-button mt-2 w-full min-h-11" type="submit">Change month</button>
      </form>

      <form action={createBudget} className="ios-card mb-5 grid min-w-0 gap-4 p-4">
        <div>
          <h2 className="text-lg font-bold text-app-text">Create envelope</h2>
          <p className="mt-1 text-sm text-app-muted">Use categories like {starterEnvelopeNames.join(", ")}.</p>
        </div>
        <Field label="Category">
          <select className="ios-input" name="category_id" required disabled={(categories ?? []).length === 0}>
            {(categories ?? []).length === 0 ? <option value="">Add an expense category first</option> : null}
            {categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </Field>
        <Field label="Month">
          <input className="ios-input" type="month" name="month" defaultValue={month} required />
        </Field>
        <Field label="Monthly amount">
          <input className="ios-input" name="amount" type="number" min="0" step="0.01" inputMode="decimal" placeholder="800" required />
        </Field>
        <ToggleRow name="is_shared" label="Shared budget" description="Visible to both household members." />
        <button className="ios-button disabled:opacity-50" type="submit" disabled={(categories ?? []).length === 0}>Save budget</button>
      </form>

      <div className="grid gap-3">
        {budgets?.map((budget) => {
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
            <p className="mt-1 text-sm text-app-muted">Create a category budget to track monthly spending progress.</p>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
