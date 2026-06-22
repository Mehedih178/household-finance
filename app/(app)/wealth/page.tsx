import { saveNetWorthSnapshot } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { CashFlowChart } from "@/components/charts";
import { Field } from "@/components/form-fields";
import { ProgressBar } from "@/components/progress-bar";
import { monthRange } from "@/lib/budgeting";
import { requireHousehold } from "@/lib/data";
import { formatCurrency, monthKey } from "@/lib/utils";

const assetTypes = new Set(["checking", "savings", "cash", "investment", "crypto"]);
const liabilityTypes = new Set(["credit", "loan"]);
const milestones = [10000, 25000, 50000, 100000, 250000];

export default async function WealthPage({
  searchParams
}: {
  searchParams?: { error?: string; fire?: string };
}) {
  const { supabase, householdId } = await requireHousehold();
  const month = monthRange(monthKey());
  const [{ data: accounts }, { data: snapshots }, { data: transactions }] = await Promise.all([
    supabase.from("accounts").select("*").eq("household_id", householdId).order("type"),
    supabase.from("net_worth_snapshots").select("*").eq("household_id", householdId).order("snapshot_on", { ascending: true }).limit(12),
    supabase
      .from("transactions")
      .select("*")
      .eq("household_id", householdId)
      .gte("occurred_on", month.start)
      .lt("occurred_on", month.end)
  ]);

  const assets = (accounts ?? [])
    .filter((account) => assetTypes.has(account.type))
    .reduce((sum, account) => sum + Number(account.balance), 0);
  const liabilities = (accounts ?? [])
    .filter((account) => liabilityTypes.has(account.type))
    .reduce((sum, account) => sum + Math.abs(Number(account.balance)), 0);
  const netWorth = assets - liabilities;
  const nextMilestone = milestones.find((milestone) => milestone > netWorth) ?? milestones[milestones.length - 1];
  const previousMilestone = milestones.filter((milestone) => milestone <= netWorth).at(-1) ?? 0;
  const milestoneProgress = nextMilestone ? ((netWorth - previousMilestone) / (nextMilestone - previousMilestone)) * 100 : 100;

  const monthlyIncome = (transactions ?? []).filter((item) => item.kind === "income").reduce((sum, item) => sum + Number(item.amount), 0);
  const monthlyExpenses = (transactions ?? []).filter((item) => item.kind === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? Math.round((monthlySavings / monthlyIncome) * 100) : 0;
  const annualSpending = Number(searchParams?.fire || monthlyExpenses * 12 || 60000);
  const fireTarget = annualSpending * 25;
  const yearsToFire = monthlySavings > 0 ? Math.max(0, Math.ceil((fireTarget - netWorth) / (monthlySavings * 12))) : null;

  const chartData = (snapshots ?? []).map((snapshot) => ({
    label: snapshot.snapshot_on.slice(5),
    income: Math.max(Number(snapshot.assets), 0),
    expense: Math.max(Number(snapshot.liabilities), 0)
  }));

  return (
    <AppShell title="Wealth" backHref="/settings">
      {searchParams?.error ? (
        <div className="mb-4 rounded-2xl border border-app-danger/30 bg-app-danger/10 p-4 text-sm text-app-danger">
          {searchParams.error}
        </div>
      ) : null}

      <section className="rounded-[30px] bg-app-tint p-5 text-white shadow-ios">
        <p className="text-sm font-semibold opacity-80">Net worth</p>
        <p className="mt-2 text-4xl font-bold tracking-tight">{formatCurrency(netWorth)}</p>
        <p className="mt-2 text-sm opacity-85">{formatCurrency(assets)} assets · {formatCurrency(liabilities)} liabilities</p>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <div className="ios-card p-4">
          <p className="text-sm text-app-muted">Assets</p>
          <p className="mt-1 text-2xl font-bold text-app-success">{formatCurrency(assets)}</p>
        </div>
        <div className="ios-card p-4">
          <p className="text-sm text-app-muted">Liabilities</p>
          <p className="mt-1 text-2xl font-bold text-app-danger">{formatCurrency(liabilities)}</p>
        </div>
      </section>

      <section className="ios-card mt-5 p-4">
        <h2 className="text-lg font-bold text-app-text">Milestone tracking</h2>
        <p className="mt-1 text-sm text-app-muted">Next milestone: {formatCurrency(nextMilestone)}</p>
        <div className="mt-4">
          <ProgressBar value={milestoneProgress} />
        </div>
        <p className="mt-3 text-sm font-semibold text-app-text">
          {formatCurrency(Math.max(0, nextMilestone - netWorth))} until the next milestone.
        </p>
      </section>

      <section className="ios-card mt-5 p-4">
        <h2 className="text-lg font-bold text-app-text">Net worth history</h2>
        {chartData.length > 0 ? (
          <CashFlowChart data={chartData} />
        ) : (
          <p className="mt-3 text-sm text-app-muted">Save a monthly snapshot to start the graph.</p>
        )}
      </section>

      <form action={saveNetWorthSnapshot} className="ios-card mt-5 grid gap-4 p-4">
        <div>
          <h2 className="text-lg font-bold text-app-text">Save snapshot</h2>
          <p className="mt-1 text-sm text-app-muted">This stores today’s net worth for the graph.</p>
        </div>
        <Field label="Date">
          <input className="ios-input" name="snapshot_on" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        </Field>
        <Field label="Assets">
          <input className="ios-input" name="assets" type="number" step="0.01" inputMode="decimal" defaultValue={assets} />
        </Field>
        <Field label="Liabilities">
          <input className="ios-input" name="liabilities" type="number" step="0.01" inputMode="decimal" defaultValue={liabilities} />
        </Field>
        <button className="ios-button" type="submit">Save snapshot</button>
      </form>

      <section className="ios-card mt-5 p-4">
        <h2 className="text-lg font-bold text-app-text">FIRE calculator</h2>
        <p className="mt-1 text-sm text-app-muted">Uses current month savings and a 25x spending target.</p>
        <div className="mt-4 grid gap-2">
          <div className="flex justify-between rounded-2xl bg-app-bg px-3 py-2 text-sm">
            <span className="text-app-muted">Savings rate</span>
            <span className="font-bold text-app-text">{savingsRate}%</span>
          </div>
          <div className="flex justify-between rounded-2xl bg-app-bg px-3 py-2 text-sm">
            <span className="text-app-muted">Target number</span>
            <span className="font-bold text-app-text">{formatCurrency(fireTarget)}</span>
          </div>
          <div className="flex justify-between rounded-2xl bg-app-bg px-3 py-2 text-sm">
            <span className="text-app-muted">Years until goal</span>
            <span className="font-bold text-app-text">{yearsToFire === null ? "Add savings data" : yearsToFire}</span>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
