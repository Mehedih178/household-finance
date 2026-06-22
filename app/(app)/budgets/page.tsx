import { createBudget } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Field, ToggleRow } from "@/components/form-fields";
import { ProgressBar } from "@/components/progress-bar";
import { requireHousehold } from "@/lib/data";
import { formatCurrency, monthKey } from "@/lib/utils";

export default async function BudgetsPage({
  searchParams
}: {
  searchParams?: { month?: string };
}) {
  const month = searchParams?.month ?? monthKey();
  const { supabase, householdId } = await requireHousehold();
  const monthStart = `${month}-01`;

  const [{ data: budgets }, { data: categories }, { data: transactions }] = await Promise.all([
    supabase.from("budgets").select("*, categories(name, color)").eq("household_id", householdId).eq("month", monthStart),
    supabase.from("categories").select("*").eq("household_id", householdId).eq("kind", "expense").order("name"),
    supabase.from("transactions").select("*").eq("household_id", householdId).eq("kind", "expense").gte("occurred_on", monthStart).lt("occurred_on", `${month}-32`)
  ]);

  return (
    <AppShell title="Budgets">
      <form className="mb-4">
        <input className="ios-input" type="month" name="month" defaultValue={month} />
        <button className="ios-secondary-button mt-2 w-full min-h-11" type="submit">Change month</button>
      </form>

      <form action={createBudget} className="ios-card mb-5 grid gap-4 p-4">
        <Field label="Category">
          <select className="ios-input" name="category_id" required>
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
        <button className="ios-button" type="submit">Save budget</button>
      </form>

      <div className="grid gap-3">
        {budgets?.map((budget) => {
          const spent = (transactions ?? [])
            .filter((transaction) => transaction.category_id === budget.category_id)
            .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
          const percent = Number(budget.amount) ? (spent / Number(budget.amount)) * 100 : 0;
          return (
            <div key={budget.id} className="ios-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-app-text">{budget.categories?.name ?? "Budget"}</p>
                <p className="text-sm text-app-muted">{Math.round(percent)}%</p>
              </div>
              <ProgressBar value={percent} />
              <p className="mt-3 text-sm text-app-muted">{formatCurrency(spent)} spent of {formatCurrency(Number(budget.amount))}</p>
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
