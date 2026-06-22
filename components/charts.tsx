"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export function CashFlowChart({ data }: { data: Array<{ label: string; income: number; expense: number }> }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 0, top: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="income" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#34c759" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#34c759" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="expense" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#ff3b30" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#ff3b30" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(142,142,147,.18)" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis hide />
          <Tooltip />
          <Area dataKey="income" stroke="#34c759" fill="url(#income)" strokeWidth={3} />
          <Area dataKey="expense" stroke="#ff3b30" fill="url(#expense)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SpendingChart({ data }: { data: Array<{ name: string; amount: number }> }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 0, top: 12, bottom: 0 }}>
          <CartesianGrid stroke="rgba(142,142,147,.18)" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis hide />
          <Tooltip />
          <Bar dataKey="amount" fill="#007aff" radius={[10, 10, 10, 10]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
