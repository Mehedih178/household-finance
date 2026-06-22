import { formatCurrency } from "@/lib/utils";

export function monthRange(month: string) {
  const start = `${month}-01`;
  const endDate = new Date(`${start}T00:00:00`);
  endDate.setMonth(endDate.getMonth() + 1);
  return { start, end: endDate.toISOString().slice(0, 10) };
}

export function previousMonthKey(month: string) {
  const date = new Date(`${month}-01T00:00:00`);
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().slice(0, 7);
}

export function daysLeftInMonth(month: string) {
  const today = new Date();
  const selectedMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  if (month !== selectedMonth) return 0;

  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return Math.max(0, end.getDate() - today.getDate());
}

export function budgetAlert({
  budgetAmount,
  daysLeft,
  spent,
  categoryName
}: {
  budgetAmount: number;
  daysLeft: number;
  spent: number;
  categoryName: string;
}) {
  if (!budgetAmount) return null;

  const percent = Math.round((spent / budgetAmount) * 100);
  if (spent > budgetAmount) {
    return `You are ${formatCurrency(spent - budgetAmount)} over your ${categoryName} budget.`;
  }

  if (percent >= 80 && daysLeft > 0) {
    return `You've spent ${percent}% of your ${categoryName} budget with ${daysLeft} days left.`;
  }

  if (percent >= 65 && daysLeft >= 10) {
    return `You've spent ${percent}% of your ${categoryName} budget with plenty of month left.`;
  }

  return null;
}
