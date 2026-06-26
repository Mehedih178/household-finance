import { createFinancialNote } from "@/app/actions";
import { AccountForm } from "@/components/account-form";
import { AppShell } from "@/components/app-shell";
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

  const assetTypes = new Set(["checking", "savings", "cash", "investment", "crypto"]);
  const liabilityTypes = new Set(["credit", "loan"]);
  const assetAccounts = (accounts ?? []).filter((account) => assetTypes.has(account.type));
  const liabilityAccounts = (accounts ?? []).filter((account) => liabilityTypes.has(account.type));
  const assetsTotal = assetAccounts.reduce((sum, account) => sum + Number(account.balance), 0);
  const liabilitiesTotal = liabilityAccounts.reduce((sum, account) => sum + Number(account.balance), 0);
  const netWorth = assetsTotal - liabilitiesTotal;

  return (
    <AppShell title="Accounts">
      <section className="grid gap-3">
        <div className="rounded-[30px] bg-app-card p-5 shadow-ios-sm">
          <p className="text-sm font-semibold text-app-muted">Net worth snapshot</p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-app-text">{formatCurrency(netWorth)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="ios-card p-4">
            <p className="text-sm font-semibold text-app-muted">Assets</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-app-text">{formatCurrency(assetsTotal)}</p>
          </div>
          <div className="ios-card p-4">
            <p className="text-sm font-semibold text-app-muted">Debt</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-app-danger">{formatCurrency(liabilitiesTotal)}</p>
          </div>
        </div>
      </section>

      <AccountForm />

      <section className="mt-5 rounded-2xl bg-app-bg p-4 text-sm text-app-muted">
        Card purchases should be logged as expenses. Credit card balances are tracked separately here as debt, not cash.
      </section>

      <section className="mt-5">
        <h2 className="mb-3 text-lg font-bold text-app-text">Cash and assets</h2>
        <div className="grid gap-3">
        {assetAccounts.map((account) => {
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
        {assetAccounts.length === 0 ? (
          <div className="ios-card p-5 text-center">
            <p className="font-semibold text-app-text">No asset accounts yet</p>
            <p className="mt-1 text-sm text-app-muted">Add checking, savings, cash, investment, or crypto accounts.</p>
          </div>
        ) : null}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="mb-3 text-lg font-bold text-app-text">Credit cards and loans</h2>
        <div className="grid gap-3">
        {liabilityAccounts.map((account) => {
          const accountNotes = (notes ?? []).filter((note) => note.target_id === account.id);
          return (
          <div key={account.id} className="ios-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-app-text">{account.name}</p>
                <p className="text-sm capitalize text-app-muted">{account.type} · {account.is_shared ? "Shared" : "Personal"}</p>
                <p className="mt-1 text-xs text-app-muted">Added by {account.profiles?.full_name ?? account.profiles?.email ?? "member"}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-app-danger">Owe {formatCurrency(Number(account.balance))}</p>
                <p className="mt-1 text-xs text-app-muted">Liability</p>
              </div>
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
        {liabilityAccounts.length === 0 ? (
          <div className="ios-card p-5 text-center">
            <p className="font-semibold text-app-text">No debt accounts yet</p>
            <p className="mt-1 text-sm text-app-muted">Add credit cards or loans here so they reduce net worth instead of inflating cash.</p>
          </div>
        ) : null}
        </div>
      </section>
    </AppShell>
  );
}
