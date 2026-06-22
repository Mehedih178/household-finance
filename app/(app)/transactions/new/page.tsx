import { TransactionForm } from "@/components/transaction-form";
import { AppShell } from "@/components/app-shell";
import { requireHousehold } from "@/lib/data";

export default async function NewTransactionPage() {
  const { supabase, householdId } = await requireHousehold();
  const [{ data: categories }, { data: accounts }] = await Promise.all([
    supabase.from("categories").select("*").eq("household_id", householdId).order("name"),
    supabase.from("accounts").select("*").eq("household_id", householdId).order("name")
  ]);

  return (
    <AppShell title="Add" backHref="/transactions">
      <TransactionForm categories={categories ?? []} accounts={accounts ?? []} />
    </AppShell>
  );
}
