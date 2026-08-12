"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Sparkles, LogIn, UserPlus } from "lucide-react"
import { apiLogin, apiSignup, saveToken } from "@/lib/api"

export function AuthScreen({ onAuthed }: { onAuthed: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = mode === "login" ? await apiLogin(email, password) : await apiSignup(email, password)
      saveToken(res.access_token)
      onAuthed()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-card px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight text-foreground">Ledgerly</h1>
            <p className="text-xs text-muted-foreground">AI Expense Tracker</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-display text-base font-bold text-foreground">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {mode === "login" ? "Sign in to see your expenses" : "Email + password — no setup required"}
          </p>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
            <label className="mb-[-6px] block text-xs font-semibold text-muted-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
            <label className="mb-[-6px] block text-xs font-semibold text-muted-foreground">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="at least 6 characters"
              className={inputClass}
            />

            {error && (
              <p className="rounded-lg border border-fin-warning/30 bg-fin-warning/10 px-3 py-2 text-xs text-fin-warning">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mode === "login" ? <LogIn className="size-4" /> : <UserPlus className="size-4" />}
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login")
              setError(null)
            }}
            className="mt-4 w-full text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {mode === "login" ? "No account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}