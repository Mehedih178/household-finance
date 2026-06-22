import { createAccount, createFinancialNote } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Field, ToggleRow } from "@/components/form-fields";
import { requireHousehold } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export default async function AccountsPage() {
  const { supabase, householdId } = await requireHousehold();
  const [{ data: accounts }, { data: notes }] = await Promise.all([
    supabase
      .from("accounts")
      .select("*, profiles!accounts_created_by_fkey(full_name, email)")
      .eq("household_id", householdId)
      .order("name"),
    supabase
      .from("financial_notes")
      .select("*, profiles!financial_notes_created_by_fkey(full_name, email)")
      .eq("household_id", householdId)
      .eq("target_type", "account")
      .order("created_at", { ascending: false })
  ]);

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
            <option value="crypto">Crypto</option>
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
        {accounts?.map((account) => {
          const accountNotes = (notes ?? []).filter((note) => note.target_id === account.id);
          return (
          <div key={account.id} className="ios-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-app-text">{account.name}</p>
                <p className="text-sm capitalize text-app-muted">{account.type} · {account.is_shared ? "Shared" : "Personal"}</p>
                <p className="mt-1 text-xs text-app-muted">Added by {account.profiles?.full_name ?? account.profiles?.email ?? "member"}</p>
              </div>
              <p className="font-bold text-app-text">{formatCurrency(Number(account.balance))}</p>
            </div>
            {accountNotes.slice(0, 1).map((note) => (
              <p key={note.id} className="mt-3 rounded-2xl bg-app-bg p-3 text-sm text-app-muted">“{note.body}”</p>
            ))}
            <form action={createFinancialNote} className="mt-3 grid gap-2">
              <input type="hidden" name="target_type" value="account" />
              <input type="hidden" name="target_id" value={account.id} />
              <input type="hidden" name="next" value="/accounts" />
              <input className="ios-input min-h-11 text-sm" name="body" placeholder="Add account note" />
              <button className="ios-secondary-button min-h-10 text-sm" type="submit">Save note</button>
            </form>
          </div>
          );
        })}
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
