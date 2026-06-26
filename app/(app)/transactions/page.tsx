import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireHousehold } from "@/lib/data";
import { categoryEmoji, formatCurrency, formatShortDate, monthKey } from "@/lib/utils";

export default async function TransactionsPage({
  searchParams
}: {
  searchParams?: { account?: string; category?: string; error?: string; imported?: string; kind?: string };
}) {
  const { supabase, householdId } = await requireHousehold();
  const currentMonth = `${monthKey()}-01`;
  const [{ data: categories }, { data: accounts }, { data: budgets }] = await Promise.all([
    supabase.from("categories").select("*").eq("household_id", householdId).order("name"),
    supabase.from("accounts").select("*").eq("household_id", householdId).order("name"),
    supabase.from("budgets").select("amount").eq("household_id", householdId).eq("month", currentMonth)
  ]);

  let query = supabase
    .from("transactions")
    .select("*, categories(name), accounts(name), profiles(full_name, email)")
    .eq("household_id", householdId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (searchParams?.kind) {
    query = query.eq("kind", searchParams.kind);
  }

  if (searchParams?.category) {
    query = query.eq("category_id", searchParams.category);
  }

  if (searchParams?.account) {
    query = query.eq("account_id", searchParams.account);
  }

  const { data: transactions } = await query;
  const monthSpent = (transactions ?? [])
    .filter((transaction) => transaction.kind === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const monthBudgeted = (budgets ?? []).reduce((sum, budget) => sum + Number(budget.amount), 0);
  const monthAvailable = monthBudgeted - monthSpent;
  const groupedTransactions = (transactions ?? []).reduce<Record<string, NonNullable<typeof transactions>>>((groups, transaction) => {
    const key = transaction.occurred_on;
    const existing = groups[key] ?? [];
    existing.push(transaction);
    groups[key] = existing;
    return groups;
  }, {});
  const dayKeys = Object.keys(groupedTransactions);

  return (
    <AppShell
      title="Transactions"
      action={
        <Link href="/transactions/new" className="ios-button h-11 min-h-11 rounded-full px-4" aria-label="Add transaction">
          <Plus size={20} />
        </Link>
      }
    >
      {searchParams?.error ? (
        <div className="mb-4 rounded-2xl border border-app-danger/30 bg-app-danger/10 p-4 text-sm text-app-danger">
          {searchParams.error}
        </div>
      ) : null}

      {searchParams?.imported ? (
        <div className="mb-4 rounded-2xl border border-app-success/30 bg-app-success/10 p-4 text-sm font-semibold text-app-success">
          Imported {searchParams.imported} transactions.
        </div>
      ) : null}

      <section className="ios-card mb-4 p-4">
        <p className="text-sm font-semibold text-app-muted">Available this month</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-app-text">{formatCurrency(monthAvailable)}</p>
        <p className="mt-1 text-sm text-app-muted">
          {formatCurrency(monthSpent)} spent across {(transactions ?? []).length} transaction{(transactions ?? []).length === 1 ? "" : "s"}
        </p>
      </section>

      <form className="mb-4 grid grid-cols-3 gap-2">
        <select className="ios-input px-2 text-sm" name="kind" defaultValue={searchParams?.kind ?? ""}>
          <option value="">All</option>
          <option value="expense">Spent</option>
          <option value="income">Income</option>
        </select>
        <select className="ios-input px-2 text-sm" name="category" defaultValue={searchParams?.category ?? ""}>
          <option value="">Category</option>
          {categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <select className="ios-input px-2 text-sm" name="account" defaultValue={searchParams?.account ?? ""}>
          <option value="">Account</option>
          {accounts?.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
        </select>
        <button className="ios-secondary-button col-span-3 min-h-11" type="submit">Apply filters</button>
      </form>

      <div className="grid gap-5">
        {dayKeys.map((dayKey) => (
          <section key={dayKey}>
            <p className="mb-3 px-1 text-sm font-bold uppercase tracking-[.16em] text-app-muted">{formatShortDate(dayKey)}</p>
            <div className="grid gap-3">
              {groupedTransactions[dayKey]?.map((transaction) => (
                <Link href={`/transactions/${transaction.id}/edit`} key={transaction.id} className="ios-card flex min-h-[84px] items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-app-bg text-xl">
                      {categoryEmoji(transaction.categories?.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[17px] font-semibold text-app-text">{transaction.description}</p>
                      <p className="mt-1 text-sm text-app-muted">{transaction.categories?.name ?? "Uncategorized"}</p>
                      <p className="mt-1 text-xs text-app-muted">
                        {transaction.accounts?.name ?? "No account"}
                        {transaction.is_shared ? ` · Shared by ${transaction.profiles?.full_name ?? transaction.profiles?.email ?? "member"}` : ""}
                      </p>
                    </div>
                  </div>
                  <p className={transaction.kind === "income" ? "shrink-0 font-bold text-app-success" : "shrink-0 font-bold text-app-text"}>
                    {transaction.kind === "income" ? "+" : "-"}{formatCurrency(Number(transaction.amount))}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
        {dayKeys.length === 0 ? (
          <Link href="/transactions/new" className="ios-card block p-6 text-center font-semibold text-app-tint">
            Add the first transaction
          </Link>
        ) : null}
      </div>
    </AppShell>
  );
}
