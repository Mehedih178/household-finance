import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TransactionForm } from "@/components/transaction-form";
import { requireHousehold } from "@/lib/data";

export default async function EditTransactionPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { error?: string };
}) {
  const { supabase, householdId } = await requireHousehold();
  const [{ data: transaction }, { data: categories }, { data: accounts }, { data: notes }, { data: receipts }] = await Promise.all([
    supabase.from("transactions").select("*").eq("id", params.id).eq("household_id", householdId).single(),
    supabase.from("categories").select("*").eq("household_id", householdId).order("name"),
    supabase.from("accounts").select("*").eq("household_id", householdId).order("name"),
    supabase
      .from("financial_notes")
      .select("*, profiles!financial_notes_created_by_fkey(full_name, email)")
      .eq("household_id", householdId)
      .eq("target_type", "transaction")
      .eq("target_id", params.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("transaction_receipts")
      .select("*")
      .eq("household_id", householdId)
      .eq("transaction_id", params.id)
      .order("created_at", { ascending: false })
  ]);

  if (!transaction) notFound();

  const signedReceipts = await Promise.all(
    (receipts ?? []).map(async (receipt) => {
      const { data } = await supabase.storage.from("receipts").createSignedUrl(receipt.storage_path, 60 * 10);
      return { ...receipt, signedUrl: data?.signedUrl };
    })
  );

  return (
    <AppShell title="Edit" backHref="/transactions">
      {searchParams?.error ? (
        <div className="mb-4 rounded-2xl border border-app-danger/30 bg-app-danger/10 p-4 text-sm text-app-danger">
          {searchParams.error}
        </div>
      ) : null}
      <TransactionForm transaction={transaction} categories={categories ?? []} accounts={accounts ?? []} notes={notes ?? []} receipts={signedReceipts} />
    </AppShell>
  );
}
