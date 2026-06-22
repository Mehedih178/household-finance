import { createRecurringItem, deleteRecurringItem } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Field, ToggleRow } from "@/components/form-fields";
import { requireHousehold } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export default async function RecurringPage() {
  const { supabase, householdId } = await requireHousehold();
  const [{ data: items }, { data: categories }, { data: accounts }] = await Promise.all([
    supabase
      .from("recurring_items")
      .select("*, categories(name), accounts(name), profiles!recurring_items_created_by_fkey(full_name, email)")
      .eq("household_id", householdId)
      .order("next_due_on"),
    supabase.from("categories").select("*").eq("household_id", householdId).order("name"),
    supabase.from("accounts").select("*").eq("household_id", householdId).order("name")
  ]);

  return (
    <AppShell title="Recurring" backHref="/settings">
      <form action={createRecurringItem} className="ios-card grid gap-4 p-4">
        <Field label="Type">
          <select className="ios-input" name="kind" defaultValue="expense">
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </Field>
        <Field label="Description">
          <input className="ios-input" name="description" placeholder="Rent, paycheck, subscription" required />
        </Field>
        <Field label="Amount">
          <input className="ios-input" name="amount" type="number" min="0" step="0.01" inputMode="decimal" required />
        </Field>
        <Field label="Frequency">
          <select className="ios-input" name="frequency" defaultValue="monthly">
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </Field>
        <Field label="Next due">
          <input className="ios-input" name="next_due_on" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
        </Field>
        <Field label="Category">
          <select className="ios-input" name="category_id" defaultValue="">
            <option value="">Uncategorized</option>
            {categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </Field>
        <Field label="Account">
          <select className="ios-input" name="account_id" defaultValue="">
            <option value="">No account</option>
            {accounts?.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
        </Field>
        <ToggleRow name="is_shared" label="Shared recurring item" description="Visible to both household members." />
        <button className="ios-button" type="submit">Save recurring item</button>
      </form>

      <div className="mt-5 grid gap-3">
        {items?.map((item) => (
          <div key={item.id} className="ios-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-app-text">{item.description}</p>
                <p className="text-sm capitalize text-app-muted">
                  {item.frequency} · next {item.next_due_on} · {item.is_shared ? "Shared" : "Personal"}
                </p>
              </div>
              <p className={item.kind === "income" ? "font-bold text-app-success" : "font-bold text-app-text"}>
                {item.kind === "income" ? "+" : "-"}{formatCurrency(Number(item.amount))}
              </p>
            </div>
            <form action={deleteRecurringItem} className="mt-3">
              <input type="hidden" name="id" value={item.id} />
              <button className="text-sm font-semibold text-app-danger" type="submit">Delete</button>
            </form>
          </div>
        ))}
        {items?.length === 0 ? (
          <div className="ios-card p-5 text-center">
            <p className="font-semibold text-app-text">No recurring items yet</p>
            <p className="mt-1 text-sm text-app-muted">Add paychecks, rent, subscriptions, or bills that repeat.</p>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
