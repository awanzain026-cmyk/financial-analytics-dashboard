"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Sparkles, TrendingUp, AlertTriangle, Info, Pencil } from "lucide-react"
import { CATEGORIES, formatCurrency, type CategoryId } from "./data"
import { BudgetModal } from "./budget-modal"
import type { Expense } from "@/lib/api"

const EASE = [0.16, 1, 0.3, 1] as const

type Insight = { id: number; tone: "positive" | "warning" | "neutral"; title: string; body: string }

function byCategory(expenses: Expense[]) {
  const map = new Map<CategoryId, number>()
  for (const e of expenses) {
    const id = e.category as CategoryId
    map.set(id, (map.get(id) ?? 0) + e.amount)
  }
  return [...map.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
}

function buildInsights(
  spent: number,
  count: number,
  budget: number,
  pendingCount: number,
  byCat: [CategoryId, number][]
): Insight[] {
  const out: Insight[] = []
  const add = (tone: Insight["tone"], title: string, body: string) => {
    out.push({ id: out.length + 1, tone, title, body })
  }

  if (budget > 0 && spent > 0) {
    const now = new Date()
    const day = now.getDate()
    const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - day
    const pct = (spent / budget) * 100

    if (spent > budget) {
      add(
        "warning",
        "Over budget this month",
        `You've spent ${formatCurrency(spent)} against a ${formatCurrency(budget, { cents: false })} budget — over by ${formatCurrency(spent - budget)}.`
      )
    } else {
      const pace = spent / day
      const expected = budget / (day + daysLeft)
      if (pace >= expected * 1.15) {
        add(
          "warning",
          `Using budget faster than planned`,
          `${pct.toFixed(0)}% of your ${formatCurrency(budget, { cents: false })} budget is spent with ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left.`
        )
      } else if (pace <= expected * 0.85) {
        add(
          "positive",
          "On pace to stay under budget",
          `${pct.toFixed(0)}% of your monthly budget used so far, with ${daysLeft} ${daysLeft === 1 ? "day" : "days"} remaining.`
        )
      } else {
        add(
          "neutral",
          "Budget pacing looks right",
          `${pct.toFixed(0)}% used with ${daysLeft} ${daysLeft === 1 ? "day" : "days"} to go — you're in line with this month's budget.`
        )
      }
    }
  }

  if (byCat.length > 0) {
    const [topId, topSpent] = byCat[0]
    const total = spent || byCat.reduce((s, [, v]) => s + v, 0)
    add(
      "neutral",
      `${CATEGORIES[topId].label} is your biggest spend`,
      `${formatCurrency(topSpent)} this month — ${((topSpent / total) * 100).toFixed(0)}% of all spending.`
    )
  } else if (budget === 0) {
    add("neutral", "No budget set yet", "Set a monthly budget to see pacing insights here.")
  }

  if (pendingCount > 0) {
    add(
      "neutral",
      `${pendingCount} ${pendingCount === 1 ? "expense" : "expenses"} waiting for review`,
      "Confirm or change them in the AI Categorization queue."
    )
  } else {
    add("positive", "Review queue is clear", "All expenses have been confirmed. Categories stay accurate.")
  }

  if (count > 0) {
    add(
      "neutral",
      `Month so far: ${count} transactions`,
      `Averaging ${formatCurrency(spent / count)} per transaction across ${formatCurrency(spent, { cents: false })}.`
    )
  }

  return out.slice(0, 4)
}

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const config = {
    positive: { icon: TrendingUp, color: "var(--fin-positive)" },
    warning: { icon: AlertTriangle, color: "var(--fin-warning)" },
    neutral: { icon: Info, color: "var(--chart-5)" },
  }[insight.tone]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.15 + index * 0.08, ease: EASE }}
      className="flex gap-3 rounded-xl border border-border bg-card p-3.5"
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `color-mix(in oklab, ${config.color} 14%, transparent)`, color: config.color }}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{insight.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{insight.body}</p>
      </div>
    </motion.div>
  )
}

export function BudgetsInsights({
  expenses,
  budget,
  pendingCount,
  onSaveBudget,
}: {
  expenses: Expense[]
  budget: number
  pendingCount: number
  onSaveBudget: (value: number) => Promise<void>
}) {
  const [budgetOpen, setBudgetOpen] = useState(false)

  const spent = expenses.reduce((s, e) => s + e.amount, 0)
  const count = expenses.length
  const byCat = byCategory(expenses)
  const insights = buildInsights(spent, count, budget, pendingCount, byCat)

  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
  const over = budget > 0 && spent > budget
  const barColor = over ? "var(--fin-negative)" : pct > 85 ? "var(--fin-warning)" : "var(--chart-1)"
  const maxSpent = byCat[0]?.[1] ?? 0

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Budgets */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="rounded-2xl border border-border bg-card p-5 shadow-soft"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-bold text-foreground">Budget</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {count} {count === 1 ? "expense" : "expenses"} this month
            </p>
          </div>
          <button
            onClick={() => setBudgetOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
          >
            <Pencil className="size-3" />
            {budget > 0 ? "Edit" : "Set"}
          </button>
        </div>

        {budget === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center">
            <p className="text-sm font-semibold text-foreground">No budget set</p>
            <p className="max-w-[14rem] text-xs text-muted-foreground">
              Set a monthly budget to track your pace here.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
                {formatCurrency(spent)}
              </span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                of {formatCurrency(budget, { cents: false })}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: barColor }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
              />
            </div>
            <p
              className={`mt-1.5 text-xs font-medium ${
                over ? "text-fin-negative" : pct > 85 ? "text-fin-warning" : "text-muted-foreground"
              }`}
            >
              {over
                ? `Over budget by ${formatCurrency(spent - budget)}`
                : `${pct.toFixed(0)}% of your monthly budget used`}
            </p>
          </>
        )}

        {byCat.length > 0 && (
          <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Top categories this month
            </p>
            {byCat.slice(0, 5).map(([id, value], i) => {
              const cat = CATEGORIES[id]
              const Icon = cat.icon
              const width = maxSpent > 0 ? (value / maxSpent) * 100 : 0
              return (
                <div key={id}>
                  <div className="mb-1.5 flex items-center gap-2">
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
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {value > 0 && spent > 0 ? `${((value / spent) * 100).toFixed(0)}%` : ""}
                    </span>
                    <span className="w-16 text-right font-mono text-xs font-semibold tabular-nums text-foreground">
                      {formatCurrency(value, { cents: false })}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: cat.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 0.7, delay: 0.15 + i * 0.06, ease: EASE }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.section>

      {/* AI Insights */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
        className="rounded-2xl border border-primary/15 bg-gradient-to-b from-primary/[0.05] to-card p-5 shadow-soft"
      >
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-foreground">AI Insights</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Computed from this month&apos;s activity</p>
          </div>
        </div>
        {insights.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center">
            <p className="text-sm font-semibold text-foreground">Nothing to report yet</p>
            <p className="max-w-[14rem] text-xs text-muted-foreground">
              Add expenses and set a budget to unlock insights.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {insights.map((insight, i) => (
              <InsightCard key={insight.id} insight={insight} index={i} />
            ))}
          </div>
        )}
      </motion.section>

      <BudgetModal
        open={budgetOpen}
        initial={budget}
        onClose={() => setBudgetOpen(false)}
        onSave={onSaveBudget}
      />
    </div>
  )
}