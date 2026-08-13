"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Sparkles, Check, Pencil, X, Loader2 } from "lucide-react"
import {
  CATEGORIES,
  CATEGORY_LIST,
  formatCurrency,
  type CategoryId,
} from "./data"
import type { Expense } from "@/lib/api"

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const tone =
    value >= 0.9 ? "var(--fin-positive)" : value >= 0.75 ? "var(--chart-3)" : "var(--fin-warning)"
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: tone }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="font-mono text-[11px] font-semibold tabular-nums" style={{ color: tone }}>
        {pct}%
      </span>
    </div>
  )
}

function CategoryChip({ id, selected, onClick }: { id: CategoryId; selected?: boolean; onClick?: () => void }) {
  const cat = CATEGORIES[id]
  const Icon = cat.icon
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
        selected
          ? "border-transparent text-white"
          : "border-border bg-card text-muted-foreground hover:border-ring/40 hover:text-foreground"
      }`}
      style={selected ? { backgroundColor: cat.color } : undefined}
    >
      <Icon className="size-3.5" />
      {cat.label}
    </button>
  )
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function QueueRow({
  item,
  busy,
  onResolve,
}: {
  item: Expense
  busy: boolean
  onResolve: (id: number, category: CategoryId) => void
}) {
  const [editing, setEditing] = useState(false)
  const [choice, setChoice] = useState<CategoryId>(item.category as CategoryId)
  const cat = CATEGORIES[choice]
  const Icon = cat.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}
      transition={{ type: "spring", stiffness: 400, damping: 34 }}
      className="rounded-xl border border-border bg-card p-3.5"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `color-mix(in oklab, ${cat.color} 14%, transparent)`, color: cat.color }}
        >
          <Icon className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{item.description}</p>
            <p className="shrink-0 font-mono text-sm font-bold tabular-nums text-foreground">
              {formatCurrency(item.amount)}
            </p>
          </div>
          <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{formatDate(item.date)}</p>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-[11px] text-muted-foreground">{item.category}</span>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
              <Sparkles className="size-3" />
              AI match
            </span>
            <ConfidenceBar value={item.confidence} />
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
              {CATEGORY_LIST.map((c) => (
                <CategoryChip key={c.id} id={c.id} selected={choice === c.id} onClick={() => setChoice(c.id)} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        {!editing ? (
          <>
            <span className="mr-auto flex items-center gap-1.5 text-xs text-muted-foreground">
              Suggested:{" "}
              <span className="inline-flex items-center gap-1 font-semibold" style={{ color: cat.color }}>
                <Icon className="size-3.5" />
                {cat.label}
              </span>
            </span>
            <button
              onClick={() => setEditing(true)}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              <Pencil className="size-3.5" />
              Change
            </button>
            <button
              onClick={() => onResolve(item.id, choice)}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              Confirm
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(false)}
              className="ml-auto flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" />
              Cancel
            </button>
            <button
              onClick={() => onResolve(item.id, choice)}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              Save as {CATEGORIES[choice].label}
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}

export function AiCategorization({
  pending,
  onReview,
}: {
  pending: Expense[]
  onReview: (id: number, category: CategoryId) => void
}) {
  const [busyId, setBusyId] = useState<number | null>(null)

  const handleResolve = async (id: number, category: CategoryId) => {
    setBusyId(id)
    try {
      await onReview(id, category)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="flex flex-col rounded-2xl border border-border bg-secondary/50 p-5 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold tracking-tight text-foreground">AI Categorization</h2>
            <p className="text-xs text-muted-foreground">Review what Ledgerly auto-tagged for you</p>
          </div>
        </div>
        <span className="rounded-full bg-card px-2.5 py-1 font-mono text-[11px] font-semibold text-muted-foreground">
          {pending.length} to review
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {pending.map((item) => (
            <QueueRow key={item.id} item={item} busy={busyId === item.id} onResolve={handleResolve} />
          ))}
        </AnimatePresence>

        {pending.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center"
          >
            <div className="flex size-11 items-center justify-center rounded-full bg-fin-positive/12 text-fin-positive">
              <Check className="size-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">Inbox zero</p>
            <p className="max-w-[15rem] text-xs text-muted-foreground">
              Every transaction is categorized. New charges will appear here automatically.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  )
}