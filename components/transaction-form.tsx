import { deleteTransaction, saveTransaction } from "@/app/actions";
import { Field, ToggleRow } from "@/components/form-fields";
import type { Database } from "@/lib/supabase/database.types";
import Link from "next/link";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Account = Database["public"]["Tables"]["accounts"]["Row"];
type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

export function TransactionForm({
  transaction,
  categories,
  accounts
}: {
  transaction?: Transaction;
  categories: Category[];
  accounts: Account[];
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
        <form action={deleteTransaction}>
          <input type="hidden" name="id" value={transaction.id} />
          <button className="ios-secondary-button w-full border-app-danger/30 text-app-danger" type="submit">Delete transaction</button>
        </form>
      ) : null}
    </div>
  );
}
