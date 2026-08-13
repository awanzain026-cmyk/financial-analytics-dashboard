"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Mail, Wallet, Receipt, ShieldCheck, LogOut, Pencil } from "lucide-react"
import { formatCurrency } from "./data"
import { BudgetModal } from "./budget-modal"

const EASE = [0.16, 1, 0.3, 1] as const

function Row({
  icon: Icon,
  label,
  value,
  delay,
}: {
  icon: typeof Mail
  label: string
  value: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: EASE }}
      className="flex items-center gap-3 py-3"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm font-semibold text-foreground">{value}</p>
      </div>
    </motion.div>
  )
}

export function Settings({
  email,
  budget,
  expenseCount,
  onSaveBudget,
  onLogout,
}: {
  email: string
  budget: number
  expenseCount: number
  onSaveBudget: (value: number) => Promise<void>
  onLogout: () => void
}) {
  const [budgetOpen, setBudgetOpen] = useState(false)

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="rounded-2xl border border-border bg-card p-5 shadow-soft"
      >
        <h3 className="font-display text-sm font-bold text-foreground">Account</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">How you sign in to Ledgerly</p>
        <div className="mt-2 divide-y divide-border">
          <Row icon={Mail} label="Email" value={email || "—"} delay={0.05} />
          <Row icon={Receipt} label="Expenses recorded" value={String(expenseCount)} delay={0.1} />
          <Row icon={ShieldCheck} label="Auth" value="Email + password · JWT" delay={0.15} />
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
        className="rounded-2xl border border-border bg-card p-5 shadow-soft"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-bold text-foreground">Monthly budget</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Used across Overview, Budgets and Insights</p>
          </div>
          <button
            onClick={() => setBudgetOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
          >
            <Pencil className="size-3" />
            Edit
          </button>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="font-mono text-3xl font-bold tabular-nums text-foreground">
            {budget > 0 ? formatCurrency(budget) : "—"}
          </span>
          {budget === 0 && <span className="text-xs text-muted-foreground">No budget set yet</span>}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          <Wallet className="mr-1 inline size-3" />
          One number for the whole month. Split by category in the Budgets view.
        </p>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
        className="rounded-2xl border border-fin-negative/20 bg-card p-5 shadow-soft"
      >
        <h3 className="font-display text-sm font-bold text-foreground">Danger zone</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Sign out of this device. Your data stays safe.</p>
        <button
          onClick={onLogout}
          className="mt-4 flex items-center gap-2 rounded-xl border border-fin-negative/25 bg-fin-negative/10 px-4 py-2.5 text-sm font-semibold text-fin-negative transition-colors hover:bg-fin-negative/15"
        >
          <LogOut className="size-4" />
          Log out
        </button>
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