"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  Cell,
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
  X,
} from "lucide-react"
import {
  SPENDING_TREND,
  CATEGORY_SPEND,
  CATEGORIES,
  formatCurrency,
} from "./data"

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

function SpendingTrend() {
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
          March
        </div>
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={SPENDING_TREND} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
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
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

function CategoryDonut() {
  const data = CATEGORY_SPEND.map((c) => ({
    ...c,
    label: CATEGORIES[c.id].label,
    color: CATEGORIES[c.id].color,
  }))
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const top = [...data].sort((a, b) => b.value - a.value).slice(0, 4)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.2, ease: EASE }}
      className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft"
    >
      <h3 className="font-display text-sm font-bold text-foreground">By category</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">Where your money went</p>

      <div className="relative mx-auto my-3 h-40 w-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={52}
              outerRadius={72}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((entry) => (
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
    </motion.div>
  )
}

function BudgetModal({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean
  initial: number
  onClose: () => void
  onSave: (value: number) => Promise<void>
}) {
  const [value, setValue] = useState(String(initial || ""))
  const [saving, setSaving] = useState(false)

  async function submit() {
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) return
    setSaving(true)
    try {
      await onSave(parsed)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-soft-lg"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-foreground">Monthly budget</h3>
              <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              One number for the whole month. "Budget left" is this minus what you&apos;ve spent.
            </p>
            <input
              autoFocus
              type="number"
              min={1}
              step={0.01}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="e.g. 3000"
              className="mt-4 w-full rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary"
            />
            <button
              onClick={submit}
              disabled={saving || !(Number(value) > 0)}
              className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save budget"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Overview({
  spentMonth,
  countMonth,
  avgMonth,
  budget,
  onSaveBudget,
}: {
  spentMonth: number
  countMonth: number
  avgMonth: number
  budget: number
  onSaveBudget: (value: number) => Promise<void>
}) {
  const [budgetOpen, setBudgetOpen] = useState(false)
  const budgetLeft = budget > 0 ? budget - spentMonth : null

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
        <SpendingTrend />
        <CategoryDonut />
      </div>
    </div>
  )
}
