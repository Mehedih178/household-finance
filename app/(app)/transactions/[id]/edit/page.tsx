import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TransactionForm } from "@/components/transaction-form";
import { requireHousehold } from "@/lib/data";

export default async function EditTransactionPage({ params }: { params: { id: string } }) {
  const { supabase, householdId } = await requireHousehold();
  const [{ data: transaction }, { data: categories }, { data: accounts }, { data: notes }] = await Promise.all([
    supabase.from("transactions").select("*").eq("id", params.id).eq("household_id", householdId).single(),
    supabase.from("categories").select("*").eq("household_id", householdId).order("name"),
    supabase.from("accounts").select("*").eq("household_id", householdId).order("name"),
    supabase
      .from("financial_notes")
      .select("*, profiles!financial_notes_created_by_fkey(full_name, email)")
      .eq("household_id", householdId)
      .eq("target_type", "transaction")
      .eq("target_id", params.id)
      .order("created_at", { ascending: false })
  ]);

  if (!transaction) notFound();

  return (
    <AppShell title="Edit" backHref="/transactions">
      <TransactionForm transaction={transaction} categories={categories ?? []} accounts={accounts ?? []} notes={notes ?? []} />
    </AppShell>
  );
}
