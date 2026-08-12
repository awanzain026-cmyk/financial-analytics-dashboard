"use client"

import { motion } from "motion/react"
import { Sparkles, ChevronRight, Loader2, Receipt, Sparkle } from "lucide-react"
import type { Expense } from "@/lib/api"
import { CATEGORIES, formatCurrency, type CategoryId } from "./data"

export function Transactions({
  expenses,
  error,
  demoBusy,
  onLoadDemo,
}: {
  expenses: Expense[] | null
  error: string | null
  demoBusy: boolean
  onLoadDemo: () => void
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-border bg-card p-5 shadow-soft"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-bold text-foreground">Recent transactions</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Saved from our backend, live</p>
        </div>
        <button className="flex items-center gap-1 text-xs font-semibold text-primary transition-opacity hover:opacity-80">
          View all
          <ChevronRight className="size-4" />
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-fin-warning/30 bg-fin-warning/10 px-3 py-2 text-xs text-fin-warning">
          {error}
        </p>
      )}

      {expenses === null && !error && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading…
        </div>
      )}

      {expenses !== null && expenses.length === 0 && !error && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Receipt className="size-5" />
          </div>
          <p className="text-sm font-semibold text-foreground">No expenses yet</p>
          <p className="max-w-[16rem] text-xs text-muted-foreground">
            Click "Add expense" and your AI-categorized charges will show up here.
          </p>
          <button
            onClick={onLoadDemo}
            disabled={demoBusy}
            className="mt-2 flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Sparkle className="size-3.5" />
            {demoBusy ? "Loading…" : "Load demo data"}
          </button>
        </div>
      )}

      <ul className="flex flex-col">
        {expenses?.map((tx, i) => {
          const cat = CATEGORIES[tx.category as CategoryId] ?? CATEGORIES.shopping
          const Icon = cat.icon
          return (
            <motion.li
              key={tx.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3 border-b border-border py-3 last:border-0"
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `color-mix(in oklab, ${cat.color} 14%, transparent)`, color: cat.color }}
              >
                <Icon className="size-[18px]" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{tx.description}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{cat.label}</span>
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    <Sparkles className="size-2.5" />
                    AI · {Math.round(tx.confidence * 100)}%
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className="font-mono text-sm font-bold tabular-nums text-foreground">
                  {formatCurrency(tx.amount)}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{tx.date}</p>
              </div>
            </motion.li>
          )
        })}
      </ul>
    </motion.section>
  )
}