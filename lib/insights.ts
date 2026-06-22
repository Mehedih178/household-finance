type TransactionLike = {
  amount: number | string;
  category_id: string | null;
  categories?: { name: string | null } | null;
  kind: "income" | "expense";
};

type BudgetLike = {
  amount: number | string;
  category_id: string;
};

function amount(value: number | string) {
  return Number(value) || 0;
}

export function totals(transactions: TransactionLike[]) {
  const income = transactions
    .filter((transaction) => transaction.kind === "income")
    .reduce((sum, transaction) => sum + amount(transaction.amount), 0);
  const expenses = transactions
    .filter((transaction) => transaction.kind === "expense")
    .reduce((sum, transaction) => sum + amount(transaction.amount), 0);

  return { income, expenses, savings: income - expenses };
}

export function categoryTotals(transactions: TransactionLike[]) {
  return Object.values(
    transactions
      .filter((transaction) => transaction.kind === "expense")
      .reduce<Record<string, { name: string; amount: number }>>((acc, transaction) => {
        const name = transaction.categories?.name ?? "Other";
        acc[name] = acc[name] ?? { name, amount: 0 };
        acc[name].amount += amount(transaction.amount);
        return acc;
      }, {})
  ).sort((a, b) => b.amount - a.amount);
}

export function budgetAdherence(transactions: TransactionLike[], budgets: BudgetLike[]) {
  if (!budgets.length) return 100;

  const spentByCategory = transactions
    .filter((transaction) => transaction.kind === "expense")
    .reduce<Record<string, number>>((acc, transaction) => {
      if (!transaction.category_id) return acc;
      acc[transaction.category_id] = (acc[transaction.category_id] ?? 0) + amount(transaction.amount);
      return acc;
    }, {});

  const scores = budgets.map((budget) => {
    const planned = amount(budget.amount);
    const spent = spentByCategory[budget.category_id] ?? 0;
    if (!planned) return 100;
    if (spent <= planned) return 100;
    return Math.max(0, 100 - ((spent - planned) / planned) * 100);
  });

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

export function financialHealthScore({
  currentBudgets,
  currentTransactions,
  previousTransactions
}: {
  currentBudgets: BudgetLike[];
  currentTransactions: TransactionLike[];
  previousTransactions: TransactionLike[];
}) {
  const current = totals(currentTransactions);
  const previous = totals(previousTransactions);
  const savingsRate = current.income > 0 ? Math.max(0, current.savings / current.income) : 0;
  const savingsScore = Math.min(100, Math.round(savingsRate * 250));
  const adherenceScore = budgetAdherence(currentTransactions, currentBudgets);
  const debtPayments = currentTransactions
    .filter((transaction) => /credit|loan|debt/i.test(transaction.categories?.name ?? ""))
    .reduce((sum, transaction) => sum + amount(transaction.amount), 0);
  const debtScore = debtPayments > 0 ? 100 : 70;
  const emergencyFundScore = current.savings > previous.savings ? 100 : current.savings > 0 ? 75 : 35;

  const score = Math.round(
    savingsScore * 0.35 +
      adherenceScore * 0.35 +
      debtScore * 0.15 +
      emergencyFundScore * 0.15
  );

  return {
    score: Math.max(0, Math.min(100, score)),
    parts: [
      { label: "Savings rate", score: savingsScore },
      { label: "Budget adherence", score: adherenceScore },
      { label: "Debt payments", score: debtScore },
      { label: "Emergency fund growth", score: emergencyFundScore }
    ]
  };
}

export function compareCategoryTrends(current: TransactionLike[], previous: TransactionLike[]) {
  const currentTotals = categoryTotals(current);
  const previousTotals = new Map(categoryTotals(previous).map((item) => [item.name, item.amount]));

  return currentTotals.slice(0, 8).map((item) => {
    const prior = previousTotals.get(item.name) ?? 0;
    const change = prior > 0 ? ((item.amount - prior) / prior) * 100 : 100;
    return {
      ...item,
      change: Math.round(change)
    };
  });
}

export function moneyBreakdown(transactions: TransactionLike[]) {
  const categories = categoryTotals(transactions);
  const total = categories.reduce((sum, category) => sum + category.amount, 0);

  return categories.map((category) => ({
    ...category,
    percent: total > 0 ? Math.round((category.amount / total) * 100) : 0
  }));
}
