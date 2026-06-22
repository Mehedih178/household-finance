import Link from "next/link";
import { createFinancialNote } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Field } from "@/components/form-fields";
import { requireHousehold } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

type FeedItem = {
  id: string;
  at: string;
  body: string;
  detail: string;
  emoji: string;
  href?: string;
};

function memberName(profile: { full_name: string | null; email: string | null } | null | undefined) {
  return profile?.full_name ?? profile?.email?.split("@")[0] ?? "Someone";
}

export default async function FeedPage() {
  const { supabase, householdId } = await requireHousehold();
  const [{ data: transactions }, { data: contributions }, { data: goals }, { data: notes }] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, categories(name), profiles!transactions_created_by_fkey(full_name, email)")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("goal_contributions")
      .select("*, goals(name, target_amount), profiles(full_name, email)")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("goals")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false }),
    supabase
      .from("financial_notes")
      .select("*, profiles!financial_notes_created_by_fkey(full_name, email)")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false })
      .limit(20)
  ]);

  const contributionTotals = new Map<string, number>();
  for (const contribution of contributions ?? []) {
    contributionTotals.set(contribution.goal_id, (contributionTotals.get(contribution.goal_id) ?? 0) + Number(contribution.amount));
  }

  const goalEvents: FeedItem[] = (goals ?? [])
    .filter((goal) => (contributionTotals.get(goal.id) ?? 0) >= Number(goal.target_amount))
    .map((goal) => ({
      id: `goal-${goal.id}`,
      at: goal.updated_at,
      body: `${goal.name} goal completed`,
      detail: `${formatCurrency(Number(goal.target_amount))} milestone reached`,
      emoji: "🏆",
      href: "/goals"
    }));

  const items: FeedItem[] = [
    ...(transactions ?? []).map((transaction) => ({
      id: `transaction-${transaction.id}`,
      at: transaction.created_at,
      body: `${memberName(transaction.profiles)} added ${formatCurrency(Number(transaction.amount))} ${transaction.categories?.name ?? transaction.kind}`,
      detail: `${transaction.description} · ${transaction.kind === "income" ? "Income" : "Expense"}`,
      emoji: transaction.kind === "income" ? "💵" : "🧾",
      href: `/transactions/${transaction.id}/edit`
    })),
    ...(contributions ?? []).map((contribution) => {
      const goal = Array.isArray(contribution.goals) ? contribution.goals[0] : contribution.goals;
      return {
        id: `contribution-${contribution.id}`,
        at: contribution.created_at,
        body: `${memberName(contribution.profiles)} contributed ${formatCurrency(Number(contribution.amount))}`,
        detail: `${goal?.name ?? "Goal"}${contribution.note ? ` · ${contribution.note}` : ""}`,
        emoji: "🎯",
        href: "/goals"
      };
    }),
    ...(notes ?? []).map((note) => ({
      id: `note-${note.id}`,
      at: note.created_at,
      body: `${memberName(note.profiles)} added a note`,
      detail: note.body,
      emoji: "📝",
      href: note.target_type === "transaction" && note.target_id ? `/transactions/${note.target_id}/edit` : undefined
    })),
    ...goalEvents
  ].sort((first, second) => new Date(second.at).getTime() - new Date(first.at).getTime()).slice(0, 40);

  return (
    <AppShell title="Feed" backHref="/settings">
      <form action={createFinancialNote} className="ios-card grid gap-3 p-4">
        <div>
          <h2 className="text-lg font-bold text-app-text">Household note</h2>
          <p className="mt-1 text-sm text-app-muted">Add a private finance timeline note for both of you.</p>
        </div>
        <input type="hidden" name="target_type" value="household" />
        <input type="hidden" name="next" value="/feed" />
        <Field label="Note">
          <input className="ios-input" name="body" placeholder="Talk about vacation budget tonight" required />
        </Field>
        <button className="ios-button" type="submit">Post note</button>
      </form>

      <section className="mt-5 grid gap-3">
        {items.map((item) => {
          const content = (
            <div className="ios-card flex gap-3 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-app-bg text-xl">{item.emoji}</div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-app-text">{item.body}</p>
                <p className="mt-1 text-sm leading-5 text-app-muted">{item.detail}</p>
                <p className="mt-2 text-xs text-app-muted">{new Date(item.at).toLocaleString()}</p>
              </div>
            </div>
          );

          return item.href ? <Link key={item.id} href={item.href}>{content}</Link> : <div key={item.id}>{content}</div>;
        })}

        {items.length === 0 ? (
          <div className="ios-card p-5 text-center">
            <p className="font-semibold text-app-text">No household activity yet</p>
            <p className="mt-1 text-sm text-app-muted">Transactions, goal contributions, achievements, and notes will appear here.</p>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
