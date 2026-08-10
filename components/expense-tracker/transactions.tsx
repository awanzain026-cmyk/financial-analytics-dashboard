"use client"

import { motion } from "motion/react"
import { Sparkles, ChevronRight } from "lucide-react"
import { TRANSACTIONS, CATEGORIES, formatCurrency } from "./data"

const EASE = [0.16, 1, 0.3, 1] as const

export function Transactions() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE }}
      className="rounded-2xl border border-border bg-card p-5 shadow-soft"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-bold text-foreground">Recent transactions</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Last 10 charges across your accounts</p>
        </div>
        <button className="flex items-center gap-1 text-xs font-semibold text-primary transition-opacity hover:opacity-80">
          View all
          <ChevronRight className="size-4" />
        </button>
      </div>

      <ul className="flex flex-col">
        {TRANSACTIONS.map((tx, i) => {
          const cat = CATEGORIES[tx.category]
          const Icon = cat.icon
          return (
            <motion.li
              key={tx.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.03, ease: EASE }}
              className="flex items-center gap-3 border-b border-border py-3 last:border-0"
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `color-mix(in oklab, ${cat.color} 14%, transparent)`, color: cat.color }}
              >
                <Icon className="size-[18px]" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{tx.merchant}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{cat.label}</span>
                  {tx.auto && (
                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      <Sparkles className="size-2.5" />
                      Auto
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="font-mono text-sm font-bold tabular-nums text-foreground">
                  -{formatCurrency(tx.amount)}
                </p>
                <p className="text-[11px] text-muted-foreground">{tx.date}</p>
              </div>
            </motion.li>
          )
        })}
      </ul>
    </motion.section>
  )
}
