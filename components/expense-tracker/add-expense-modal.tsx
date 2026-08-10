"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Sparkles, X, Check } from "lucide-react"
import { CATEGORIES, CATEGORY_LIST, type CategoryId } from "./data"

// Tiny keyword matcher to simulate AI categorization of typed text.
const KEYWORDS: { match: string[]; category: CategoryId }[] = [
  { match: ["coffee", "restaurant", "lunch", "dinner", "chipotle", "pizza", "cafe", "bar"], category: "dining" },
  { match: ["grocery", "groceries", "market", "trader", "safeway", "whole foods", "aldi"], category: "groceries" },
  { match: ["uber", "lyft", "gas", "shell", "fuel", "transit", "parking", "train"], category: "transport" },
  { match: ["amazon", "target", "store", "clothes", "shoes", "nike"], category: "shopping" },
  { match: ["electric", "water", "internet", "rent", "pg&e", "utility", "phone bill"], category: "bills" },
  { match: ["netflix", "spotify", "subscription", "icloud", "figma", "membership"], category: "subscriptions" },
  { match: ["movie", "concert", "game", "steam", "amc", "ticket"], category: "entertainment" },
  { match: ["pharmacy", "cvs", "doctor", "gym", "walgreens", "medicine"], category: "health" },
]

function detectCategory(text: string): { category: CategoryId; confidence: number } | null {
  const lower = text.toLowerCase()
  for (const { match, category } of KEYWORDS) {
    if (match.some((m) => lower.includes(m))) {
      return { category, confidence: 0.88 + Math.random() * 0.1 }
    }
  }
  if (lower.trim().length > 2) return { category: "shopping", confidence: 0.52 }
  return null
}

export function AddExpenseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = useState("")
  const [thinking, setThinking] = useState(false)
  const [result, setResult] = useState<{ category: CategoryId; confidence: number } | null>(null)
  const [override, setOverride] = useState<CategoryId | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) {
      setText("")
      setResult(null)
      setOverride(null)
      setThinking(false)
    }
  }, [open])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    setOverride(null)
    if (!text.trim()) {
      setResult(null)
      setThinking(false)
      return
    }
    setThinking(true)
    timer.current = setTimeout(() => {
      setResult(detectCategory(text))
      setThinking(false)
    }, 650)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [text])

  const active = override ?? result?.category ?? null

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
                  <p className="text-xs text-muted-foreground">Type it naturally — AI does the rest</p>
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

            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Description</label>
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Lunch at Chipotle $14"
              className="w-full rounded-xl border border-border bg-secondary/50 px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            />

            {/* AI suggestion */}
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
                    <span className="text-sm text-muted-foreground">Categorizing…</span>
                    <div className="ml-auto h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                      <div className="h-full w-1/3 rounded-full bg-primary/60 animate-scan" />
                    </div>
                  </motion.div>
                )}

                {!thinking && active && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.05] px-3.5 py-3">
                      <span
                        className="flex size-8 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: `color-mix(in oklab, ${CATEGORIES[active].color} 16%, transparent)`,
                          color: CATEGORIES[active].color,
                        }}
                      >
                        {(() => {
                          const Icon = CATEGORIES[active].icon
                          return <Icon className="size-4" />
                        })()}
                      </span>
                      <div>
                        <p className="text-[11px] font-medium text-primary">AI suggests</p>
                        <p className="text-sm font-semibold text-foreground">{CATEGORIES[active].label}</p>
                      </div>
                      {result && !override && (
                        <span className="ml-auto font-mono text-xs font-semibold text-muted-foreground">
                          {Math.round(result.confidence * 100)}%
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {CATEGORY_LIST.map((c) => {
                        const Icon = c.icon
                        const selected = active === c.id
                        return (
                          <button
                            key={c.id}
                            onClick={() => setOverride(c.id)}
                            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors ${
                              selected
                                ? "border-transparent text-white"
                                : "border-border text-muted-foreground hover:text-foreground"
                            }`}
                            style={selected ? { backgroundColor: c.color } : undefined}
                          >
                            <Icon className="size-3" />
                            {c.label}
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={onClose}
              disabled={!active}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check className="size-4" />
              Save expense
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
