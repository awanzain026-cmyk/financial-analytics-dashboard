"use client"

import { motion } from "motion/react"
import { PieChart, Receipt, TrendingUp, Wallet } from "lucide-react"
import { CATEGORY_LIST, formatCurrency, type CategoryId } from "./data"
import type { Expense } from "@/lib/api"

const EASE = [0.16, 1, 0.3, 1] as const

function KpiCard({
  label,
  value,
  icon: Icon,
  delay,
}: {
  label: string
  value: string
  icon: typeof Wallet
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: EASE }}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="truncate font-display text-lg font-bold text-foreground">{value}</p>
      </div>
    </motion.div>
  )
}

export function Categories({ expenses }: { expenses: Expense[] }) {
  const now = new Date()
  const monthName = now.toLocaleString("en-US", { month: "long", year: "numeric" })

  const byCat = new Map<CategoryId, { spent: number; count: number }>()
  for (const cat of CATEGORY_LIST) byCat.set(cat.id, { spent: 0, count: 0 })
  for (const e of expenses) {
    const entry = byCat.get(e.category as CategoryId) ?? { spent: 0, count: 0 }
    entry.spent += e.amount
    entry.count += 1
    byCat.set(e.category as CategoryId, entry)
  }

  const rows = CATEGORY_LIST.map((cat) => ({ cat, ...byCat.get(cat.id)! }))
    .filter((r) => r.spent > 0)
    .sort((a, b) => b.spent - a.spent)

  const totalSpent = rows.reduce((s, r) => s + r.spent, 0)
  const usedCount = rows.length
  const top = rows[0]
  const maxSpent = rows[0]?.spent ?? 0

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard label={`Spent in ${monthName}`} value={formatCurrency(totalSpent)} icon={Wallet} delay={0} />
        <KpiCard label="Transactions" value={String(expenses.length)} icon={Receipt} delay={0.05} />
        <KpiCard label="Categories used" value={`${usedCount} / 8`} icon={PieChart} delay={0.1} />
        <KpiCard
          label="Top category"
          value={top ? top.cat.label : "—"}
          icon={TrendingUp}
          delay={0.15}
        />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="rounded-2xl border border-border bg-card p-5 shadow-soft"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-bold text-foreground">Spending by category</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {monthName} · share of the month&apos;s total
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <PieChart className="size-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">No spending this month</p>
            <p className="max-w-[14rem] text-xs text-muted-foreground">
              Add an expense or load demo data to see your category breakdown.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {rows.map((row, i) => {
              const { cat } = row
              const Icon = cat.icon
              const share = totalSpent > 0 ? (row.spent / totalSpent) * 100 : 0
              const width = maxSpent > 0 ? (row.spent / maxSpent) * 100 : 0
              return (
                <li key={cat.id}>
                  <div className="mb-1.5 flex items-center gap-2.5">
                    <span
                      className="flex size-6 items-center justify-center rounded-md"
                      style={{
                        backgroundColor: `color-mix(in oklab, ${cat.color} 14%, transparent)`,
                        color: cat.color,
                      }}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <span className="flex-1 text-sm font-medium text-foreground">{cat.label}</span>
                    <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {row.count} {row.count === 1 ? "txn" : "txns"}
                    </span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {share.toFixed(0)}%
                    </span>
                    <span className="w-20 text-right font-mono text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(row.spent, { cents: false })}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: cat.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 0.7, delay: 0.1 + i * 0.06, ease: EASE }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </motion.section>
    </div>
  )
}