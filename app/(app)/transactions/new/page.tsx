import { TransactionForm } from "@/components/transaction-form";
import { AppShell } from "@/components/app-shell";
import { requireHousehold } from "@/lib/data";

export default async function NewTransactionPage({
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
    <AppShell title="Add" backHref="/transactions">
      {searchParams?.error ? (
        <div className="mb-4 rounded-2xl border border-app-danger/30 bg-app-danger/10 p-4 text-sm text-app-danger">
          {searchParams.error}
        </div>
      ) : null}
      <TransactionForm categories={categories ?? []} accounts={accounts ?? []} />
    </AppShell>
  );
}
