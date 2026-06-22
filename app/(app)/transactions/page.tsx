import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireHousehold } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export default async function TransactionsPage({
  searchParams
}: {
  searchParams?: { category?: string; account?: string; kind?: string };
}) {
  const { supabase, householdId } = await requireHousehold();
  let query = supabase
    .from("transactions")
    .select("*, categories(name, color), accounts(name), profiles!transactions_created_by_fkey(full_name, email)")
    .eq("household_id", householdId)
    .order("occurred_on", { ascending: false });

  if (searchParams?.category) query = query.eq("category_id", searchParams.category);
  if (searchParams?.account) query = query.eq("account_id", searchParams.account);
  if (searchParams?.kind) query = query.eq("kind", searchParams.kind);

  const [{ data: transactions }, { data: categories }, { data: accounts }] = await Promise.all([
    query,
    supabase.from("categories").select("*").eq("household_id", householdId).order("name"),
    supabase.from("accounts").select("*").eq("household_id", householdId).order("name")
  ]);

  return (
    <AppShell
      title="Activity"
      action={<Link href="/transactions/new" className="ios-button h-11 min-h-11 rounded-full px-4"><Plus size={20} /></Link>}
    >
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

      <div className="grid gap-3">
        {transactions?.map((transaction) => (
          <Link href={`/transactions/${transaction.id}/edit`} key={transaction.id} className="ios-card flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-app-text">{transaction.description}</p>
              <p className="text-sm text-app-muted">
                {transaction.occurred_on} · {transaction.categories?.name ?? "Uncategorized"} · {transaction.is_shared ? "Shared" : "Personal"}
              </p>
              <p className="mt-1 text-xs text-app-muted">Added by {transaction.profiles?.full_name ?? transaction.profiles?.email ?? "member"}</p>
            </div>
            <p className={transaction.kind === "income" ? "font-bold text-app-success" : "font-bold text-app-text"}>
              {transaction.kind === "income" ? "+" : "-"}{formatCurrency(Number(transaction.amount))}
            </p>
          </Link>
        ))}
        {transactions?.length === 0 ? (
          <Link href="/transactions/new" className="ios-card block p-6 text-center font-semibold text-app-tint">
            Add the first transaction
          </Link>
        ) : null}
      </div>
    </AppShell>
  );
}
