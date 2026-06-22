import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TransactionForm } from "@/components/transaction-form";
import { requireHousehold } from "@/lib/data";

export default async function EditTransactionPage({ params }: { params: { id: string } }) {
  const { supabase, householdId } = await requireHousehold();
  const [{ data: transaction }, { data: categories }, { data: accounts }] = await Promise.all([
    supabase.from("transactions").select("*").eq("id", params.id).eq("household_id", householdId).single(),
    supabase.from("categories").select("*").eq("household_id", householdId).order("name"),
    supabase.from("accounts").select("*").eq("household_id", householdId).order("name")
  ]);

  if (!transaction) notFound();

  return (
    <AppShell title="Edit" backHref="/transactions">
      <TransactionForm transaction={transaction} categories={categories ?? []} accounts={accounts ?? []} />
    </AppShell>
  );
}
