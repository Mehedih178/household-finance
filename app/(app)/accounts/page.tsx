import { createAccount } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Field, ToggleRow } from "@/components/form-fields";
import { requireHousehold } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export default async function AccountsPage() {
  const { supabase, householdId } = await requireHousehold();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("*, profiles!accounts_created_by_fkey(full_name, email)")
    .eq("household_id", householdId)
    .order("name");

  const total = (accounts ?? []).reduce((sum, account) => sum + Number(account.balance), 0);

  return (
    <AppShell title="Accounts">
      <section className="rounded-[30px] bg-app-card p-5 shadow-ios-sm">
        <p className="text-sm font-semibold text-app-muted">Tracked balance</p>
        <p className="mt-2 text-4xl font-bold tracking-tight text-app-text">{formatCurrency(total)}</p>
      </section>

      <form action={createAccount} className="ios-card mt-5 grid gap-4 p-4">
        <Field label="Account name">
          <input className="ios-input" name="name" placeholder="Joint Checking" required />
        </Field>
        <Field label="Type">
          <select className="ios-input" name="type" defaultValue="checking">
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
            <option value="credit">Credit card</option>
            <option value="cash">Cash</option>
            <option value="investment">Investment</option>
            <option value="loan">Loan</option>
          </select>
        </Field>
        <Field label="Current balance">
          <input className="ios-input" name="balance" type="number" step="0.01" inputMode="decimal" placeholder="0.00" />
        </Field>
        <ToggleRow name="is_shared" label="Shared account" description="Visible in household totals." />
        <button className="ios-button" type="submit">Add account</button>
      </form>

      <div className="mt-5 grid gap-3">
        {accounts?.map((account) => (
          <div key={account.id} className="ios-card flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-app-text">{account.name}</p>
              <p className="text-sm capitalize text-app-muted">{account.type} · {account.is_shared ? "Shared" : "Personal"}</p>
              <p className="mt-1 text-xs text-app-muted">Added by {account.profiles?.full_name ?? account.profiles?.email ?? "member"}</p>
            </div>
            <p className="font-bold text-app-text">{formatCurrency(Number(account.balance))}</p>
          </div>
        ))}
        {accounts?.length === 0 ? (
          <div className="ios-card p-5 text-center">
            <p className="font-semibold text-app-text">No accounts yet</p>
            <p className="mt-1 text-sm text-app-muted">Add checking, savings, credit, or cash accounts to make totals useful.</p>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
