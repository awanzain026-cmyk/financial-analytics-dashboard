"use client"

import { motion } from "motion/react"
import { Sparkles, TrendingUp, AlertTriangle, Info } from "lucide-react"
import { BUDGETS, CATEGORIES, INSIGHTS, formatCurrency, type Insight } from "./data"

const EASE = [0.16, 1, 0.3, 1] as const

function BudgetBar({ id, spent, limit, index }: { id: keyof typeof CATEGORIES; spent: number; limit: number; index: number }) {
  const cat = CATEGORIES[id]
  const Icon = cat.icon
  const pct = Math.min((spent / limit) * 100, 100)
  const over = spent > limit
  const barColor = over ? "var(--fin-negative)" : pct > 85 ? "var(--fin-warning)" : cat.color

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className="flex size-6 items-center justify-center rounded-md"
          style={{ backgroundColor: `color-mix(in oklab, ${cat.color} 14%, transparent)`, color: cat.color }}
        >
          <Icon className="size-3.5" />
        </span>
        <span className="flex-1 text-sm font-medium text-foreground">{cat.label}</span>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          <span className={over ? "font-semibold text-fin-negative" : "text-foreground"}>
            {formatCurrency(spent, { cents: false })}
          </span>{" "}
          / {formatCurrency(limit, { cents: false })}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, delay: 0.1 + index * 0.06, ease: EASE }}
        />
      </div>
    </div>
  )
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

export function BudgetsInsights() {
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
            <h3 className="font-display text-sm font-bold text-foreground">Budgets</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Tracking against monthly limits</p>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {BUDGETS.map((b, i) => (
            <BudgetBar key={b.id} id={b.id} spent={b.spent} limit={b.limit} index={i} />
          ))}
        </div>
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
            <p className="mt-0.5 text-xs text-muted-foreground">Generated from your recent activity</p>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {INSIGHTS.map((insight, i) => (
            <InsightCard key={insight.id} insight={insight} index={i} />
          ))}
        </div>
      </motion.section>
    </div>
  )
}
