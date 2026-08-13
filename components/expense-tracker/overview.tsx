"use client"

import { useState } from "react"
import { motion } from "motion/react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  Cell,
  Line,
  Pie,
  PieChart,
} from "recharts"
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Wallet,
  Landmark,
  Receipt,
} from "lucide-react"
import { CATEGORIES, formatCurrency, type CategoryId } from "./data"
import type { Expense } from "@/lib/api"
import { BudgetModal } from "./budget-modal"

const EASE = [0.16, 1, 0.3, 1] as const

function KpiCard({
  label,
  value,
  change,
  invertChange,
  icon: Icon,
  delay,
  sub,
}: {
  label: string
  value: string
  change?: number
  invertChange?: boolean
  icon: typeof Wallet
  delay: number
  sub?: string
}) {
  // For spending, an increase is "bad" (negative tone). invertChange handles that.
  const positiveTone = change === undefined ? true : invertChange ? change < 0 : change >= 0
  const up = (change ?? 0) >= 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: EASE }}
      className="rounded-2xl border border-border bg-card p-5 shadow-soft"
    >
      <div className="flex items-center justify-between">
        <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
          <Icon className="size-[18px]" />
        </div>
        {change !== undefined && (
          <span
            className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold ${
              positiveTone ? "bg-fin-positive/12 text-fin-positive" : "bg-fin-negative/12 text-fin-negative"
            }`}
          >
            {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {up ? "+" : ""}
            {change}%
          </span>
        )}
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold tabular-nums tracking-tight text-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </motion.div>
  )
}

function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-popover p-3 shadow-soft-lg">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Day {label}
      </p>
      <p className="font-mono text-sm font-bold text-foreground">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

function SpendingTrend({
  monthName,
  data,
  dailyBudget,
}: {
  monthName: string
  data: { day: string; spent: number; budget?: number }[]
  dailyBudget: number | null
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.15, ease: EASE }}
      className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft lg:col-span-2"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-bold text-foreground">Spending this month</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Daily outflow vs. average daily budget</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
          <TrendingUp className="size-3.5 text-primary" />
          {monthName}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Receipt className="size-5" />
          </div>
          <p className="text-sm font-semibold text-foreground">No spending this month</p>
          <p className="max-w-[14rem] text-xs text-muted-foreground">
            Add an expense or load demo data to see your daily trend.
          </p>
        </div>
      ) : (
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                dy={6}
              />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="spent"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                fill="url(#spendFill)"
                dot={false}
                activeDot={{ r: 4, fill: "var(--chart-1)", stroke: "var(--card)", strokeWidth: 2 }}
              />
              {dailyBudget !== null && (
                <Line
                  type="monotone"
                  dataKey="budget"
                  stroke="var(--muted-foreground)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  )
}

function CategoryDonut({ data }: { data: { id: CategoryId; value: number }[] }) {
  const mapped = data.map((c) => ({
    ...c,
    label: CATEGORIES[c.id]?.label ?? c.id,
    color: CATEGORIES[c.id]?.color ?? "var(--chart-1)",
  }))
  const total = mapped.reduce((sum, d) => sum + d.value, 0)
  const top = [...mapped].sort((a, b) => b.value - a.value).slice(0, 4)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.2, ease: EASE }}
      className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft"
    >
      <h3 className="font-display text-sm font-bold text-foreground">By category</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">Where your money went</p>

      {total === 0 ? (
        <div className="mt-3 flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <TrendingUp className="size-5" />
          </div>
          <p className="text-sm font-semibold text-foreground">No spending yet</p>
          <p className="max-w-[14rem] text-xs text-muted-foreground">
            Your category breakdown will appear here once you add expenses.
          </p>
        </div>
      ) : (
        <>
          <div className="relative mx-auto my-3 h-40 w-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mapped}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={52}
                  outerRadius={72}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {mapped.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total</span>
              <span className="font-mono text-lg font-bold text-foreground">{formatCurrency(total, { cents: false })}</span>
            </div>
          </div>

          <ul className="flex flex-col gap-2">
            {top.map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-sm">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="flex-1 text-muted-foreground">{c.label}</span>
                <span className="font-mono font-semibold tabular-nums text-foreground">
                  {formatCurrency(c.value, { cents: false })}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </motion.div>
  )
}

export function Overview({
  expenses,
  budget,
  onSaveBudget,
}: {
  expenses: Expense[]
  budget: number
  onSaveBudget: (value: number) => Promise<void>
}) {
  const [budgetOpen, setBudgetOpen] = useState(false)

  // Real KPIs, computed from the month's expenses (same source as the charts).
  const spentMonth = expenses.reduce((sum, e) => sum + e.amount, 0)
  const countMonth = expenses.length
  const avgMonth = countMonth > 0 ? spentMonth / countMonth : 0
  const budgetLeft = budget > 0 ? budget - spentMonth : null

  // Chart data: daily totals + per-category totals for this month.
  const now = new Date()
  const monthName = now.toLocaleString("en-US", { month: "long" })
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dailyBudget = budget > 0 ? budget / daysInMonth : null

  const byDay = new Map<number, number>()
  const byCategory = new Map<string, number>()
  for (const e of expenses) {
    const day = Number(e.date.slice(8, 10))
    byDay.set(day, (byDay.get(day) ?? 0) + e.amount)
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount)
  }
  const round2 = (n: number) => Math.round(n * 100) / 100
  const trend = [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([day, spent]) => ({
      day: String(day),
      spent: round2(spent),
      ...(dailyBudget !== null ? { budget: round2(dailyBudget) } : {}),
    }))
  const donutData = [...byCategory.entries()].map(([id, value]) => ({
    id: id as CategoryId,
    value: round2(value),
  }))

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard
          label="Spent this month"
          value={formatCurrency(spentMonth)}
          icon={Wallet}
          delay={0}
        />
        <button onClick={() => setBudgetOpen(true)} className="text-left">
          <KpiCard
            label="Budget left"
            value={budgetLeft === null ? "—" : formatCurrency(budgetLeft)}
            icon={Receipt}
            delay={0.05}
            sub={
              budget > 0
                ? `of ${formatCurrency(budget, { cents: false })} budget · tap to edit`
                : "No budget set · tap to set one"
            }
          />
        </button>
        <KpiCard
          label="Avg per transaction"
          value={formatCurrency(avgMonth)}
          icon={Landmark}
          delay={0.1}
          sub="this month"
        />
        <KpiCard
          label="Transactions"
          value={String(countMonth)}
          icon={TrendingUp}
          delay={0.15}
          sub="this month"
        />
      </div>

      <BudgetModal
        open={budgetOpen}
        initial={budget}
        onClose={() => setBudgetOpen(false)}
        onSave={onSaveBudget}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SpendingTrend monthName={monthName} data={trend} dailyBudget={dailyBudget} />
        <CategoryDonut data={donutData} />
      </div>
    </div>
  )
}
