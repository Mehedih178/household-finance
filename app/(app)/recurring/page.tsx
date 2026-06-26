import { createRecurringItem, deleteRecurringItem } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Field, ToggleRow } from "@/components/form-fields";
import { requireHousehold } from "@/lib/data";
import { formatCurrency, formatShortDate } from "@/lib/utils";

export default async function RecurringPage({
  searchParams
}: {
  searchParams?: { deleted?: string; edit?: string; error?: string; saved?: string };
}) {
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
  const editingItem = items?.find((item) => item.id === searchParams?.edit) ?? null;
  const expenseItems = (items ?? []).filter((item) => item.kind === "expense");
  const incomeItems = (items ?? []).filter((item) => item.kind === "income");

  return (
    <AppShell title="Recurring" backHref="/settings">
      {searchParams?.error ? (
        <div className="mb-4 rounded-2xl border border-app-danger/30 bg-app-danger/10 p-4 text-sm text-app-danger">
          {searchParams.error}
        </div>
      ) : null}
      {searchParams?.saved ? (
        <div className="mb-4 rounded-2xl border border-app-success/30 bg-app-success/10 p-4 text-sm font-semibold text-app-success">
          Recurring item saved.
        </div>
      ) : null}
      {searchParams?.deleted ? (
        <div className="mb-4 rounded-2xl border border-app-success/30 bg-app-success/10 p-4 text-sm font-semibold text-app-success">
          Recurring item deleted.
        </div>
      ) : null}

      <form action={createRecurringItem} className="ios-card grid gap-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-bold text-app-text">{editingItem ? "Edit recurring item" : "Add recurring item"}</p>
          {editingItem ? <a href="/recurring" className="text-sm font-semibold text-app-tint">Cancel</a> : null}
        </div>
        {editingItem ? <input type="hidden" name="id" value={editingItem.id} /> : null}
        <Field label="Type">
          <select className="ios-input" name="kind" defaultValue={editingItem?.kind ?? "expense"}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </Field>
        <Field label="Description">
          <input className="ios-input" name="description" placeholder="Rent, paycheck, subscription" defaultValue={editingItem?.description ?? ""} required />
        </Field>
        <Field label="Amount">
          <input className="ios-input" name="amount" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={editingItem ? Number(editingItem.amount) : ""} required />
        </Field>
        <Field label="Frequency">
          <select className="ios-input" name="frequency" defaultValue={editingItem?.frequency ?? "monthly"}>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </Field>
        <Field label="Next due">
          <input className="ios-input" name="next_due_on" type="date" defaultValue={editingItem?.next_due_on ?? new Date().toISOString().slice(0, 10)} required />
        </Field>
        <Field label="Category">
          <select className="ios-input" name="category_id" defaultValue={editingItem?.category_id ?? ""}>
            <option value="">Uncategorized</option>
            {categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </Field>
        <Field label="Account">
          <select className="ios-input" name="account_id" defaultValue={editingItem?.account_id ?? ""}>
            <option value="">No account</option>
            {accounts?.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
        </Field>
        <ToggleRow
          name="is_shared"
          label="Shared recurring item"
          description="Visible to both household members."
          defaultChecked={editingItem?.is_shared ?? true}
        />
        <button className="ios-button" type="submit">{editingItem ? "Save changes" : "Save recurring item"}</button>
      </form>

      <section className="mt-5">
        <h2 className="mb-3 text-lg font-bold text-app-text">Recurring bills</h2>
        <div className="grid gap-3">
        {expenseItems.map((item) => (
          <div key={item.id} className="ios-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-app-text">{item.description}</p>
                <p className="text-sm capitalize text-app-muted">
                  {item.frequency} · next {formatShortDate(item.next_due_on)} · {item.is_shared ? "Shared" : "Personal"}
                </p>
              </div>
              <p className="font-bold text-app-text">-{formatCurrency(Number(item.amount))}</p>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <a href={`/recurring?edit=${item.id}`} className="text-sm font-semibold text-app-tint">Edit</a>
              <form action={deleteRecurringItem}>
                <input type="hidden" name="id" value={item.id} />
                <button className="text-sm font-semibold text-app-danger" type="submit">Delete</button>
              </form>
            </div>
          </div>
        ))}
        {expenseItems.length === 0 ? (
          <div className="ios-card p-5 text-center">
            <p className="font-semibold text-app-text">No recurring bills yet</p>
            <p className="mt-1 text-sm text-app-muted">Add rent, subscriptions, or other bills that repeat.</p>
          </div>
        ) : null}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="mb-3 text-lg font-bold text-app-text">Recurring income</h2>
        <div className="grid gap-3">
          {incomeItems.map((item) => (
            <div key={item.id} className="ios-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-app-text">{item.description}</p>
                  <p className="text-sm capitalize text-app-muted">
                    {item.frequency} · next {formatShortDate(item.next_due_on)} · {item.is_shared ? "Shared" : "Personal"}
                  </p>
                </div>
                <p className="font-bold text-app-success">+{formatCurrency(Number(item.amount))}</p>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <a href={`/recurring?edit=${item.id}`} className="text-sm font-semibold text-app-tint">Edit</a>
                <form action={deleteRecurringItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <button className="text-sm font-semibold text-app-danger" type="submit">Delete</button>
                </form>
              </div>
            </div>
          ))}
          {incomeItems.length === 0 ? (
            <div className="ios-card p-5 text-center">
              <p className="font-semibold text-app-text">No recurring income yet</p>
              <p className="mt-1 text-sm text-app-muted">Add paychecks or any income that repeats.</p>
            </div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
