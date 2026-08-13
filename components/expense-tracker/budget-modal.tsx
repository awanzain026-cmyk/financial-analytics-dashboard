"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { X } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const

export function BudgetModal({
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