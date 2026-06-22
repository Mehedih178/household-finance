import { addGoalContribution, createGoal } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Field, ToggleRow } from "@/components/form-fields";
import { ProgressBar } from "@/components/progress-bar";
import { requireHousehold } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export default async function GoalsPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  const { supabase, householdId } = await requireHousehold();
  const [{ data: goals }, { data: contributions }] = await Promise.all([
    supabase.from("goals").select("*").eq("household_id", householdId).order("created_at", { ascending: false }),
    supabase.from("goal_contributions").select("*, profiles(full_name, email)").eq("household_id", householdId).order("contributed_on", { ascending: false })
  ]);

  return (
    <AppShell title="Goals" backHref="/settings">
      {searchParams?.error ? (
        <div className="mb-4 rounded-2xl border border-app-danger/30 bg-app-danger/10 p-4 text-sm text-app-danger">
          {searchParams.error}
        </div>
      ) : null}

      <form action={createGoal} className="ios-card grid gap-4 p-4">
        <div>
          <h2 className="text-lg font-bold text-app-text">Create shared goal</h2>
          <p className="mt-1 text-sm text-app-muted">Vacation, house down payment, emergency fund, or new car.</p>
        </div>
        <Field label="Goal name">
          <input className="ios-input" name="name" placeholder="Japan Trip" required />
        </Field>
        <Field label="Target amount">
          <input className="ios-input" name="target_amount" type="number" min="1" step="0.01" inputMode="decimal" placeholder="5000" required />
        </Field>
        <Field label="Target date">
          <input className="ios-input" name="target_date" type="date" />
        </Field>
        <Field label="Color">
          <input className="ios-input h-14" name="color" type="color" defaultValue="#007aff" />
        </Field>
        <input type="hidden" name="icon" value="flag" />
        <ToggleRow name="is_shared" label="Shared goal" description="Both household members can see and contribute." />
        <button className="ios-button" type="submit">Save goal</button>
      </form>

      <section className="mt-5 grid gap-3">
        {goals?.map((goal) => {
          const goalContributions = (contributions ?? []).filter((item) => item.goal_id === goal.id);
          const saved = goalContributions.reduce((sum, item) => sum + Number(item.amount), 0);
          const target = Number(goal.target_amount);
          const percent = target ? (saved / target) * 100 : 0;
          const completed = saved >= target;

          return (
            <div key={goal.id} className="ios-card p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-app-text">{goal.name}</p>
                  <p className="mt-1 text-sm text-app-muted">
                    {formatCurrency(saved)} / {formatCurrency(target)}
                  </p>
                </div>
                <p className={completed ? "rounded-full bg-app-success/15 px-3 py-1 text-sm font-bold text-app-success" : "rounded-full bg-app-bg px-3 py-1 text-sm font-bold text-app-tint"}>
                  {Math.min(100, Math.round(percent))}%
                </p>
              </div>
              <ProgressBar value={percent} />
              {completed ? (
                <p className="mt-3 rounded-2xl bg-app-success/10 p-3 text-sm font-semibold text-app-success">
                  Achievement unlocked: {goal.name} completed.
                </p>
              ) : null}

              <form action={addGoalContribution} className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                <input type="hidden" name="goal_id" value={goal.id} />
                <input type="hidden" name="contributed_on" value={new Date().toISOString().slice(0, 10)} />
                <input className="ios-input" name="amount" type="number" min="1" step="0.01" inputMode="decimal" placeholder="Add amount" required />
                <button className="ios-button min-h-12 px-4" type="submit">Add</button>
              </form>

              {goalContributions.length > 0 ? (
                <div className="mt-4 grid gap-2">
                  {goalContributions.slice(0, 3).map((item) => {
                    const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
                    return (
                      <div key={item.id} className="flex items-center justify-between rounded-2xl bg-app-bg px-3 py-2 text-sm">
                        <span className="text-app-muted">{profile?.full_name ?? profile?.email ?? "Member"}</span>
                        <span className="font-semibold text-app-text">{formatCurrency(Number(item.amount))}</span>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}

        {goals?.length === 0 ? (
          <div className="ios-card p-5 text-center">
            <p className="font-semibold text-app-text">No shared goals yet</p>
            <p className="mt-1 text-sm text-app-muted">Create your first goal together, then track progress as both of you contribute.</p>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
