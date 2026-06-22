import { createFinancialNote, deleteTransaction, saveTransaction } from "@/app/actions";
import { Field, ToggleRow } from "@/components/form-fields";
import type { Database } from "@/lib/supabase/database.types";
import Link from "next/link";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Account = Database["public"]["Tables"]["accounts"]["Row"];
type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type FinancialNote = Database["public"]["Tables"]["financial_notes"]["Row"] & {
  profiles?: { full_name: string | null; email: string | null } | null;
};

export function TransactionForm({
  transaction,
  categories,
  accounts,
  notes = []
}: {
  transaction?: Transaction;
  categories: Category[];
  accounts: Account[];
  notes?: FinancialNote[];
}) {
  return (
    <div className="grid gap-4">
      <form action={saveTransaction} className="grid gap-4">
        <input type="hidden" name="id" value={transaction?.id ?? ""} />
        <Field label="Type">
          <select className="ios-input" name="kind" defaultValue={transaction?.kind ?? "expense"}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </Field>
        <Field label="Description">
          <input className="ios-input" name="description" defaultValue={transaction?.description} placeholder="Groceries" required />
        </Field>
        <Field label="Amount">
          <input className="ios-input" name="amount" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={transaction?.amount ?? ""} placeholder="0.00" required />
        </Field>
        <Field label="Date">
          <input className="ios-input" name="occurred_on" type="date" defaultValue={transaction?.occurred_on ?? new Date().toISOString().slice(0, 10)} required />
        </Field>
        <Field label="Category">
          <select className="ios-input" name="category_id" defaultValue={transaction?.category_id ?? ""}>
            <option value="">Uncategorized</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </Field>
        <Field label="Account">
          <select className="ios-input" name="account_id" defaultValue={transaction?.account_id ?? ""}>
            <option value="">No account</option>
            {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
        </Field>
        <ToggleRow name="is_shared" label="Shared with household" description="Turn off to keep this personal." defaultChecked={transaction?.is_shared ?? true} />
        <button className="ios-button" type="submit">{transaction ? "Save changes" : "Add transaction"}</button>
        <Link href="/transactions" className="ios-secondary-button w-full">
          Cancel
        </Link>
      </form>
      {transaction ? (
        <>
          <section className="ios-card grid gap-3 p-4">
            <div>
              <h2 className="text-lg font-bold text-app-text">Notes</h2>
              <p className="mt-1 text-sm text-app-muted">Attach context for reviewing later.</p>
            </div>
            {notes.length > 0 ? (
              <div className="grid gap-2">
                {notes.map((note) => (
                  <div key={note.id} className="rounded-2xl bg-app-bg p-3">
                    <p className="text-sm text-app-text">“{note.body}”</p>
                    <p className="mt-1 text-xs text-app-muted">
                      {note.profiles?.full_name ?? note.profiles?.email ?? "Member"}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
            <form action={createFinancialNote} className="grid gap-2">
              <input type="hidden" name="target_type" value="transaction" />
              <input type="hidden" name="target_id" value={transaction.id} />
              <input type="hidden" name="next" value={`/transactions/${transaction.id}/edit`} />
              <input className="ios-input" name="body" placeholder="Add a note" />
              <button className="ios-secondary-button min-h-11" type="submit">Save note</button>
            </form>
          </section>
          <form action={deleteTransaction}>
            <input type="hidden" name="id" value={transaction.id} />
            <button className="ios-secondary-button w-full border-app-danger/30 text-app-danger" type="submit">Delete transaction</button>
          </form>
        </>
      ) : null}
    </div>
  );
}
