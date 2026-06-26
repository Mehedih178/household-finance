import { daysLeftInMonth, monthRange } from "@/lib/budgeting";
import { formatCurrency, monthKey } from "@/lib/utils";

export type InboxCategory =
  | "budget"
  | "bills"
  | "goals"
  | "achievements"
  | "household"
  | "insights"
  | "recurring";

export type FinanceInboxItem = {
  id: string;
  category: InboxCategory;
  severity: "good" | "info" | "warning" | "danger";
  title: string;
  detail: string;
  emoji: string;
  href: string;
  createdAt: string;
};

export type NotificationPreferenceLike = {
  frequency: "instant" | "daily" | "weekly";
  budget_alerts: boolean;
  bills: boolean;
  goals: boolean;
  achievements: boolean;
  household_activity: boolean;
  insights: boolean;
  recurring_transactions: boolean;
};

type ProfileLike = { full_name: string | null; email: string | null } | null;
type CategoryLike = { name: string | null } | null;
type GoalLike = {
  id: string;
  name: string;
  target_amount: number | string;
  target_date: string | null;
  created_at: string;
};
type ContributionLike = {
  id: string;
  goal_id: string;
  amount: number | string;
  note?: string | null;
  created_by: string;
  created_at: string;
  profiles?: ProfileLike | ProfileLike[];
};
type TransactionLike = {
  id: string;
  amount: number | string;
  category_id: string | null;
  created_at: string;
  created_by: string;
  description: string;
  kind: "income" | "expense";
  occurred_on: string;
  categories?: CategoryLike | CategoryLike[];
  profiles?: ProfileLike | ProfileLike[];
};
type BudgetLike = {
  id: string;
  amount: number | string;
  category_id: string;
  categories?: CategoryLike | CategoryLike[];
};
type RecurringLike = {
  id: string;
  amount: number | string;
  description: string;
  frequency: string;
  kind: "income" | "expense";
  next_due_on: string;
};
type AccountLike = {
  id: string;
  balance: number | string;
  name: string;
  type: string;
};
type SnapshotLike = {
  id: string;
  net_worth: number | string;
  snapshot_on: string;
};

export const defaultNotificationPreferences: NotificationPreferenceLike = {
  frequency: "daily",
  budget_alerts: true,
  bills: true,
  goals: true,
  achievements: true,
  household_activity: true,
  insights: true,
  recurring_transactions: true
};

function relationOne<T>(value: T | T[] | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function displayName(profile: ProfileLike | ProfileLike[] | undefined) {
  const resolved = relationOne(profile);
  return resolved?.full_name ?? resolved?.email?.split("@")[0] ?? "Someone";
}

function categoryName(transactionOrBudget: { categories?: CategoryLike | CategoryLike[] }) {
  return relationOne(transactionOrBudget.categories)?.name ?? "Uncategorized";
}

function daysBetween(start: Date, end: Date) {
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.ceil((end.getTime() - start.getTime()) / oneDay);
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function categoryEnabled(category: InboxCategory, preferences: NotificationPreferenceLike) {
  if (category === "budget") return preferences.budget_alerts;
  if (category === "bills") return preferences.bills;
  if (category === "goals") return preferences.goals;
  if (category === "achievements") return preferences.achievements;
  if (category === "household") return preferences.household_activity;
  if (category === "insights") return preferences.insights;
  if (category === "recurring") return preferences.recurring_transactions;
  return true;
}

function sumTransactions(transactions: TransactionLike[], kind: "income" | "expense") {
  return transactions.filter((transaction) => transaction.kind === kind).reduce((sum, transaction) => sum + Number(transaction.amount), 0);
}

function spendingByCategory(transactions: TransactionLike[]) {
  const totals = new Map<string, { amount: number; name: string }>();
  for (const transaction of transactions.filter((item) => item.kind === "expense")) {
    const key = transaction.category_id ?? categoryName(transaction);
    const current = totals.get(key) ?? { amount: 0, name: categoryName(transaction) };
    current.amount += Number(transaction.amount);
    totals.set(key, current);
  }
  return Array.from(totals.values()).sort((first, second) => second.amount - first.amount);
}

function netWorthFromAccounts(accounts: AccountLike[]) {
  const assetTypes = new Set(["checking", "savings", "cash", "investment", "crypto"]);
  const liabilityTypes = new Set(["credit", "loan"]);
  const assets = accounts.filter((account) => assetTypes.has(account.type)).reduce((sum, account) => sum + Number(account.balance), 0);
  const liabilities = accounts.filter((account) => liabilityTypes.has(account.type)).reduce((sum, account) => sum + Math.abs(Number(account.balance)), 0);
  return assets - liabilities;
}

export function generateFinanceInbox({
  accounts,
  budgets,
  contributions,
  currentMonthTransactions,
  goals,
  previousMonthTransactions,
  preferences = defaultNotificationPreferences,
  recurring,
  snapshots,
  today = new Date(),
  userId
}: {
  accounts: AccountLike[];
  budgets: BudgetLike[];
  contributions: ContributionLike[];
  currentMonthTransactions: TransactionLike[];
  goals: GoalLike[];
  previousMonthTransactions: TransactionLike[];
  preferences?: NotificationPreferenceLike;
  recurring: RecurringLike[];
  snapshots: SnapshotLike[];
  today?: Date;
  userId: string;
}) {
  const items: FinanceInboxItem[] = [];
  const currentMonth = monthKey(today);
  const currentRange = monthRange(currentMonth);
  const monthStart = new Date(`${currentRange.start}T00:00:00`);
  const monthEnd = new Date(`${currentRange.end}T00:00:00`);
  const elapsedDays = Math.max(1, daysBetween(monthStart, today));
  const totalDays = Math.max(1, daysBetween(monthStart, monthEnd));
  const remainingDays = daysLeftInMonth(currentMonth);
  const todayKey = isoDate(today);
  const weekStartKey = isoDate(addDays(today, -6));
  const tomorrowKey = isoDate(addDays(today, 1));
  const threeDaysKey = isoDate(addDays(today, 3));
  const now = today.toISOString();

  for (const budget of budgets) {
    const spent = currentMonthTransactions
      .filter((transaction) => transaction.kind === "expense" && transaction.category_id === budget.category_id)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    const priorSpent = previousMonthTransactions
      .filter((transaction) => transaction.kind === "expense" && transaction.category_id === budget.category_id)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    const amount = Number(budget.amount);
    const forecast = (spent / elapsedDays) * totalDays;
    const category = categoryName(budget);
    const currentDaily = spent / elapsedDays;
    const normalDaily = priorSpent > 0 ? priorSpent / totalDays : amount / totalDays;
    const paceDiff = normalDaily > 0 ? Math.round(((currentDaily - normalDaily) / normalDaily) * 100) : 0;
    const budgetDiff = forecast - amount;

    if (amount > 0 && spent / amount >= 0.8) {
      items.push({
        id: `budget-progress-${budget.id}`,
        category: "budget",
        severity: spent > amount ? "danger" : "warning",
        title: `${category} budget at ${Math.round((spent / amount) * 100)}%`,
        detail: `At current spending, you may ${budgetDiff > 0 ? `exceed budget by ${formatCurrency(budgetDiff)}` : `finish ${formatCurrency(Math.abs(budgetDiff))} under budget`}.`,
        emoji: "⚠️",
        href: "/budgets",
        createdAt: now
      });
    }

    if (Math.abs(paceDiff) >= 15 && spent > 0) {
      items.push({
        id: `budget-pace-${budget.id}`,
        category: "budget",
        severity: paceDiff > 0 ? "warning" : "good",
        title: `${category} pace ${Math.abs(paceDiff)}% ${paceDiff > 0 ? "faster" : "slower"} than normal`,
        detail: paceDiff > 0
          ? `At this pace you'll exceed budget by about ${formatCurrency(Math.max(0, budgetDiff))}.`
          : `At this pace you'll likely finish about ${formatCurrency(Math.max(0, amount - forecast))} under budget.`,
        emoji: paceDiff > 0 ? "💸" : "📉",
        href: "/budgets",
        createdAt: now
      });
    }

    if (priorSpent > 0) {
      const spike = Math.round(((spent - priorSpent) / priorSpent) * 100);
      if (Math.abs(spike) >= 18) {
        items.push({
          id: `category-spike-${budget.id}`,
          category: "insights",
          severity: spike > 0 ? "warning" : "good",
          title: `${category} spending is ${Math.abs(spike)}% ${spike > 0 ? "higher" : "lower"} than last month`,
          detail: `${formatCurrency(spent)} this month vs ${formatCurrency(priorSpent)} last month.`,
          emoji: spike > 0 ? "📈" : "📉",
          href: "/planning",
          createdAt: now
        });
      }
    }
  }

  for (const goal of goals) {
    const goalContributions = contributions.filter((contribution) => contribution.goal_id === goal.id);
    const saved = goalContributions.reduce((sum, contribution) => sum + Number(contribution.amount), 0);
    const target = Number(goal.target_amount);
    const percent = target > 0 ? Math.floor((saved / target) * 100) : 0;
    const milestone = [100, 75, 50, 25].find((value) => percent >= value);

    if (milestone) {
      items.push({
        id: `goal-milestone-${goal.id}-${milestone}`,
        category: milestone === 100 ? "achievements" : "goals",
        severity: milestone === 100 ? "good" : "info",
        title: milestone === 100 ? `${goal.name} completed` : `${goal.name} hit ${milestone}%`,
        detail: `${formatCurrency(saved)} saved toward ${formatCurrency(target)}.`,
        emoji: milestone === 100 ? "🎉" : "🎯",
        href: "/goals",
        createdAt: goalContributions.at(-1)?.created_at ?? now
      });
    }

    const latestContribution = goalContributions
      .slice()
      .sort((first, second) => new Date(second.created_at).getTime() - new Date(first.created_at).getTime())[0];
    const daysSinceContribution = latestContribution ? daysBetween(new Date(latestContribution.created_at), today) : 999;
    if (percent < 100 && daysSinceContribution >= 7) {
      items.push({
        id: `goal-reminder-${goal.id}`,
        category: "goals",
        severity: "info",
        title: `Add ${formatCurrency(50)} to ${goal.name} this week`,
        detail: "Small weekly contributions keep the goal moving without feeling heavy.",
        emoji: "💡",
        href: "/goals",
        createdAt: now
      });
    }

    if (goal.target_date && percent < 100) {
      const daysUntilGoal = daysBetween(today, new Date(`${goal.target_date}T00:00:00`));
      const expectedPercent = daysUntilGoal > 0
        ? Math.min(95, Math.round(((daysBetween(new Date(goal.created_at), today)) / Math.max(1, daysBetween(new Date(goal.created_at), new Date(`${goal.target_date}T00:00:00`)))) * 100))
        : 100;
      if (percent + 10 < expectedPercent) {
        items.push({
          id: `goal-risk-${goal.id}`,
          category: "goals",
          severity: "warning",
          title: `${goal.name} is behind schedule`,
          detail: `You are at ${percent}%; expected pace is about ${expectedPercent}% with ${Math.max(0, daysUntilGoal)} days left.`,
          emoji: "⚠️",
          href: "/goals",
          createdAt: now
        });
      }
    }
  }

  for (const item of recurring) {
    if (item.next_due_on <= threeDaysKey) {
      const dueTomorrow = item.next_due_on === tomorrowKey;
      const dueToday = item.next_due_on <= todayKey;
      const isBill = item.kind === "expense";
      items.push({
        id: `bill-${item.id}`,
        category: isBill ? "bills" : "recurring",
        severity: dueToday ? "warning" : "info",
        title: isBill
          ? dueToday
            ? `${item.description} due today`
            : dueTomorrow
              ? `${item.description} renews tomorrow`
              : `${item.description} due in ${daysBetween(today, new Date(`${item.next_due_on}T00:00:00`))} days`
          : dueToday
            ? `${item.description} expected today`
            : dueTomorrow
              ? `${item.description} expected tomorrow`
              : `${item.description} expected in ${daysBetween(today, new Date(`${item.next_due_on}T00:00:00`))} days`,
        detail: `${formatCurrency(Number(item.amount))} · ${item.frequency}`,
        emoji: isBill ? "🔄" : "💰",
        href: "/recurring",
        createdAt: now
      });
    }
  }

  const recentTransactions = currentMonthTransactions.filter((transaction) => transaction.created_at >= weekStartKey);
  for (const transaction of recentTransactions.slice(0, 5)) {
    if (transaction.created_by !== userId) {
      items.push({
        id: `spouse-activity-${transaction.id}`,
        category: "household",
        severity: "info",
        title: `${displayName(transaction.profiles)} added ${transaction.kind === "income" ? "income" : `${categoryName(transaction)} expense`}`,
        detail: `${transaction.description}: ${formatCurrency(Number(transaction.amount))}.`,
        emoji: transaction.kind === "income" ? "💰" : "🛒",
        href: `/transactions/${transaction.id}/edit`,
        createdAt: transaction.created_at
      });
    }
  }

  for (const contribution of contributions.filter((item) => item.created_at >= weekStartKey && item.created_by !== userId).slice(0, 5)) {
    items.push({
      id: `spouse-contribution-${contribution.id}`,
      category: "household",
      severity: "good",
      title: `${displayName(contribution.profiles)} contributed ${formatCurrency(Number(contribution.amount))}`,
      detail: contribution.note ?? "Shared goal progress moved forward.",
      emoji: "❤️",
      href: "/goals",
      createdAt: contribution.created_at
    });
  }

  const expensesToday = currentMonthTransactions.filter((transaction) => transaction.kind === "expense" && transaction.occurred_on === todayKey);
  if (expensesToday.length === 0) {
    items.push({
      id: "no-spend-day",
      category: "achievements",
      severity: "good",
      title: "No spending today",
      detail: "Nice job. A no-spend day helps every budget category breathe.",
      emoji: "🌱",
      href: "/transactions",
      createdAt: now
    });
  }

  const averageExpense = currentMonthTransactions.filter((transaction) => transaction.kind === "expense").reduce((sum, transaction) => sum + Number(transaction.amount), 0) / Math.max(1, currentMonthTransactions.filter((transaction) => transaction.kind === "expense").length);
  const largeTransaction = currentMonthTransactions
    .filter((transaction) => transaction.kind === "expense" && Number(transaction.amount) >= Math.max(300, averageExpense * 2.5))
    .sort((first, second) => Number(second.amount) - Number(first.amount))[0];
  if (largeTransaction) {
    items.push({
      id: `large-${largeTransaction.id}`,
      category: "insights",
      severity: "warning",
      title: "Large transaction detected",
      detail: `${largeTransaction.description}: ${formatCurrency(Number(largeTransaction.amount))}.`,
      emoji: "💸",
      href: `/transactions/${largeTransaction.id}/edit`,
      createdAt: largeTransaction.created_at
    });
  }

  const lowAccount = accounts.find((account) => ["checking", "cash"].includes(account.type) && Number(account.balance) > 0 && Number(account.balance) < 500);
  if (lowAccount) {
    items.push({
      id: `low-balance-${lowAccount.id}`,
      category: "insights",
      severity: "warning",
      title: `${lowAccount.name} below ${formatCurrency(500)}`,
      detail: `Current balance is ${formatCurrency(Number(lowAccount.balance))}.`,
      emoji: "⚠️",
      href: "/accounts",
      createdAt: now
    });
  }

  const weeklyTransactions = currentMonthTransactions.filter((transaction) => transaction.occurred_on >= weekStartKey);
  const weeklyIncome = sumTransactions(weeklyTransactions, "income");
  const weeklySpent = sumTransactions(weeklyTransactions, "expense");
  const topCategory = spendingByCategory(weeklyTransactions)[0];
  items.push({
    id: "weekly-summary",
    category: "insights",
    severity: weeklyIncome - weeklySpent >= 0 ? "good" : "warning",
    title: "Week Summary",
    detail: `Income: ${formatCurrency(weeklyIncome)} · Spent: ${formatCurrency(weeklySpent)} · Saved: ${formatCurrency(weeklyIncome - weeklySpent)}${topCategory ? ` · Top: ${topCategory.name} (${formatCurrency(topCategory.amount)})` : ""}.`,
    emoji: "📊",
    href: "/planning",
    createdAt: now
  });

  const monthlyIncome = sumTransactions(currentMonthTransactions, "income");
  const monthlySpent = sumTransactions(currentMonthTransactions, "expense");
  const currentNetWorth = netWorthFromAccounts(accounts);
  const latestSnapshot = snapshots.slice().sort((first, second) => new Date(second.snapshot_on).getTime() - new Date(first.snapshot_on).getTime())[0];
  items.push({
    id: "monthly-recap",
    category: "insights",
    severity: monthlyIncome - monthlySpent >= 0 ? "good" : "warning",
    title: `${new Date(`${currentMonth}-01T00:00:00`).toLocaleString("en-US", { month: "long" })} Recap`,
    detail: `Spent: ${formatCurrency(monthlySpent)} · Saved: ${formatCurrency(monthlyIncome - monthlySpent)} · Net worth: ${formatCurrency(currentNetWorth || Number(latestSnapshot?.net_worth ?? 0))}.`,
    emoji: "📈",
    href: "/planning",
    createdAt: now
  });

  const netWorthMilestone = [250000, 100000, 50000, 25000, 10000].find((value) => currentNetWorth >= value);
  if (netWorthMilestone) {
    items.push({
      id: `net-worth-${netWorthMilestone}`,
      category: "achievements",
      severity: "good",
      title: `Net worth exceeded ${formatCurrency(netWorthMilestone)}`,
      detail: `Current tracked net worth is ${formatCurrency(currentNetWorth)}.`,
      emoji: "🏆",
      href: "/planning",
      createdAt: now
    });
  }

  const filtered = items
    .filter((item) => categoryEnabled(item.category, preferences))
    .sort((first, second) => {
      const severityRank = { danger: 4, warning: 3, info: 2, good: 1 };
      return severityRank[second.severity] - severityRank[first.severity] || new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
    });

  const unreadCount = filtered.filter((item) => item.severity === "danger" || item.severity === "warning" || item.category === "goals" || item.category === "bills").length;
  const budgetPressure = filtered.find((item) => item.category === "budget");
  const upcomingBills = filtered.filter((item) => item.category === "bills").length;
  const bestGoal = goals
    .map((goal) => {
      const saved = contributions.filter((contribution) => contribution.goal_id === goal.id).reduce((sum, contribution) => sum + Number(contribution.amount), 0);
      return { name: goal.name, percent: Number(goal.target_amount) ? Math.round((saved / Number(goal.target_amount)) * 100) : 0 };
    })
    .sort((first, second) => second.percent - first.percent)[0];
  const forecastUnder = budgets.reduce((sum, budget) => {
    const spent = currentMonthTransactions
      .filter((transaction) => transaction.kind === "expense" && transaction.category_id === budget.category_id)
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
    const forecast = (spent / elapsedDays) * totalDays;
    return sum + (Number(budget.amount) - forecast);
  }, 0);

  return {
    brief: {
      checkingBalance: accounts.find((account) => account.type === "checking")?.balance ?? null,
      goalLine: bestGoal ? `${bestGoal.name} ${bestGoal.percent}%` : "No active goals yet",
      remainingBudget: budgets.reduce((sum, budget) => {
        const spent = currentMonthTransactions
          .filter((transaction) => transaction.kind === "expense" && transaction.category_id === budget.category_id)
          .reduce((total, transaction) => total + Number(transaction.amount), 0);
        return sum + Number(budget.amount) - spent;
      }, 0),
      summary: [
        `${upcomingBills} bill${upcomingBills === 1 ? "" : "s"} due soon`,
        budgetPressure?.title ?? "Budgets are calm",
        bestGoal ? `${bestGoal.name} is ${bestGoal.percent}% funded` : "Create a shared goal"
      ],
      tip: forecastUnder >= 0
        ? `You're on track to finish ${formatCurrency(forecastUnder)} under budget this month.`
        : `At this pace, you may exceed budget by ${formatCurrency(Math.abs(forecastUnder))}.`
    },
    items: filtered,
    unreadCount
  };
}
