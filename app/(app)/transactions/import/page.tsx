import { importTransactions } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Field, ToggleRow } from "@/components/form-fields";
import { requireHousehold } from "@/lib/data";

export default async function ImportTransactionsPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  const { supabase, householdId } = await requireHousehold();
  const [{ data: categories }, { data: accounts }] = await Promise.all([
    supabase.from("categories").select("*").eq("household_id", householdId).order("name"),
    supabase.from("accounts").select("*").eq("household_id", householdId).order("name")
  ]);

  return (
    <AppShell title="Import" backHref="/transactions">
      {searchParams?.error ? (
        <div className="mb-4 rounded-2xl border border-app-danger/30 bg-app-danger/10 p-4 text-sm text-app-danger">
          {searchParams.error}
        </div>
      ) : null}

      <section className="ios-card mb-5 p-4">
        <h2 className="text-lg font-bold text-app-text">Upload bank CSV</h2>
        <p className="mt-2 text-sm leading-6 text-app-muted">
          Export transactions from your bank as CSV, then upload it here. Supported columns include Date, Description, Amount, Type, Category, and Account.
        </p>
      </section>

      <form action={importTransactions} className="grid gap-4">
        <Field label="CSV file">
          <input className="ios-input py-3" name="file" type="file" accept=".csv,text/csv" required />
        </Field>
        <Field label="Default account">
          <select className="ios-input" name="account_id" defaultValue="">
            <option value="">No account</option>
            {accounts?.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
        </Field>
        <Field label="Default category">
          <select className="ios-input" name="category_id" defaultValue="">
            <option value="">Uncategorized</option>
            {categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </Field>
        <ToggleRow name="is_shared" label="Shared import" description="Imported rows are visible to both household members." />
        <button className="ios-button" type="submit">Import transactions</button>
      </form>
    </AppShell>
  );
}
