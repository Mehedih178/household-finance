type BudgetLike = {
  amount: number | string;
  category_id: string;
  month?: string;
};

type TransactionLike = {
  amount: number | string;
  category_id: string | null;
  kind: "income" | "expense";
  occurred_on?: string;
};

type GoalLike = {
  id: string;
  name: string;
  target_amount: number | string;
};

type ContributionLike = {
  amount: number | string;
  goal_id: string;
};

function value(amount: number | string) {
  return Number(amount) || 0;
}

export function isUnderBudget({
  budgets,
  transactions
}: {
  budgets: BudgetLike[];
  transactions: TransactionLike[];
}) {
  if (!budgets.length) return false;

  return budgets.every((budget) => {
    const spent = transactions
      .filter((transaction) => transaction.kind === "expense" && transaction.category_id === budget.category_id)
      .reduce((sum, transaction) => sum + value(transaction.amount), 0);

    return spent <= value(budget.amount);
  });
}

export function savingsTotal(transactions: TransactionLike[]) {
  const income = transactions
    .filter((transaction) => transaction.kind === "income")
    .reduce((sum, transaction) => sum + value(transaction.amount), 0);
  const expenses = transactions
    .filter((transaction) => transaction.kind === "expense")
    .reduce((sum, transaction) => sum + value(transaction.amount), 0);

  return income - expenses;
}

export function completedGoals(goals: GoalLike[], contributions: ContributionLike[]) {
  return goals.filter((goal) => {
    const saved = contributions
      .filter((contribution) => contribution.goal_id === goal.id)
      .reduce((sum, contribution) => sum + value(contribution.amount), 0);

    return saved >= value(goal.target_amount);
  });
}

function monthKeysEndingAt(month: string, count: number) {
  const keys: string[] = [];
  const date = new Date(`${month}-01T00:00:00`);

  for (let index = 0; index < count; index += 1) {
    keys.push(date.toISOString().slice(0, 7));
    date.setMonth(date.getMonth() - 1);
  }

  return keys;
}

export function underBudgetStreak({
  budgets,
  month,
  transactions
}: {
  budgets: BudgetLike[];
  month: string;
  transactions: TransactionLike[];
}) {
  let streak = 0;

  for (const key of monthKeysEndingAt(month, 6)) {
    const monthBudgets = budgets.filter((budget) => budget.month?.startsWith(key));
    const monthTransactions = transactions.filter((transaction) => transaction.occurred_on?.startsWith(key));
    if (!isUnderBudget({ budgets: monthBudgets, transactions: monthTransactions })) break;
    streak += 1;
  }

  return streak;
}

export function savingsStreak({
  month,
  transactions
}: {
  month: string;
  transactions: TransactionLike[];
}) {
  let streak = 0;

  for (const key of monthKeysEndingAt(month, 6)) {
    const monthTransactions = transactions.filter((transaction) => transaction.occurred_on?.startsWith(key));
    if (savingsTotal(monthTransactions) <= 0) break;
    streak += 1;
  }

  return streak;
}
