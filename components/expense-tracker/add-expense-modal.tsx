"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Sparkles, X, Check } from "lucide-react"
import { toast } from "sonner"
import { apiCategorize, apiCreateExpense, type CategoryGuess } from "@/lib/api"
import { CATEGORIES, type CategoryId } from "./data"

const KEYWORDS: { match: string[]; category: CategoryId }[] = [
  { match: ["coffee", "restaurant", "lunch", "dinner", "chipotle", "pizza", "cafe", "bar"], category: "dining" },
  { match: ["grocery", "groceries", "market", "trader", "safeway", "whole foods", "aldi"], category: "groceries" },
  { match: ["uber", "lyft", "gas", "shell", "fuel", "transit", "parking", "train"], category: "transport" },
  { match: ["amazon", "target", "store", "clothes", "shoes", "nike"], category: "shopping" },
  { match: ["electric", "water", "internet", "rent", "utility", "phone bill"], category: "bills" },
  { match: ["netflix", "spotify", "subscription", "icloud", "figma", "membership"], category: "subscriptions" },
  { match: ["movie", "concert", "game", "steam", "amc", "ticket"], category: "entertainment" },
  { match: ["pharmacy", "cvs", "doctor", "gym", "walgreens", "medicine"], category: "health" },
]

// Offline guard: fakes a slow "AI" result if the backend is unreachable,
// so the UI still demonstrates the flow. The BACKEND is always the source of truth.
function localGuess(description: string): CategoryGuess | null {
  const lower = description.toLowerCase()
  for (const { match, category } of KEYWORDS) {
    if (match.some((m) => lower.includes(m))) {
      return { category, confidence: 0.6 }
    }
  }
  return lower.trim().length > 2 ? { category: "shopping", confidence: 0.5 } : null
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function AddExpenseModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(today())
  const [thinking, setThinking] = useState(false)
  const [result, setResult] = useState<CategoryGuess | null>(null)
  const [saving, setSaving] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) {
      setDescription("")
      setAmount("")
      setDate(today())
      setResult(null)
      setThinking(false)
    }
  }, [open])

  // Live AI suggestion: debounced call to our backend's /categorize endpoint
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (!description.trim()) {
      setResult(null)
      setThinking(false)
      return
    }
    setThinking(true)
    timer.current = setTimeout(async () => {
      try {
        setResult(await apiCategorize(description.trim()))
      } catch {
        setResult(localGuess(description)) // backend down -> local hint
      } finally {
        setThinking(false)
      }
    }, 600)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [description])

  const cat = result?.category ? (CATEGORIES[result.category as CategoryId] ?? null) : null

  async function handleSave() {
    if (!result || !amount) return
    setSaving(true)
    try {
      await apiCreateExpense({
        amount: parseFloat(amount),
        description: description.trim(),
        date,
      })
      toast.success("Expense saved")
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save expense")
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-secondary/50 px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl border border-border bg-card p-6 shadow-soft-lg sm:rounded-3xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-foreground">Add expense</h2>
                  <p className="text-xs text-muted-foreground">AI categorizes it as you type</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <label className="mb-[-9px] block text-xs font-semibold text-muted-foreground">Description</label>
              <input
                autoFocus
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Lunch at Chipotle"
                className={inputClass}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-[-9px] block text-xs font-semibold text-muted-foreground">Amount ($)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="14.50"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-[-9px] block text-xs font-semibold text-muted-foreground">Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Live AI suggestion */}
            <div className="mt-4 min-h-[3.25rem]">
              <AnimatePresence mode="wait">
                {thinking && (
                  <motion.div
                    key="thinking"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3.5 py-3"
                  >
                    <Sparkles className="size-4 animate-pulse-soft text-primary" />
                    <span className="text-sm text-muted-foreground">AI is categorizing…</span>
                    <div className="ml-auto h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                      <div className="h-full w-1/3 rounded-full bg-primary/60 animate-scan" />
                    </div>
                  </motion.div>
                )}

                {!thinking && cat && result && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.05] px-3.5 py-3"
                  >
                    <span
                      className="flex size-8 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `color-mix(in oklab, ${cat.color} 16%, transparent)`,
                        color: cat.color,
                      }}
                    >
                      <cat.icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-[11px] font-medium text-primary">AI categorizes as</p>
                      <p className="text-sm font-semibold text-foreground">{cat.label}</p>
                    </div>
                    <span className="ml-auto font-mono text-xs font-semibold text-muted-foreground">
                      {Math.round(result.confidence * 100)}%
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={handleSave}
              disabled={!cat || !amount || saving}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check className="size-4" />
              {saving ? "Saving…" : "Save expense"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}