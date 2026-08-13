"use client"

import { useCallback, useEffect, useState } from "react"
import { motion } from "motion/react"
import { Construction } from "lucide-react"
import { Sidebar, type NavId } from "./sidebar"
import { TopBar } from "./topbar"
import { Overview } from "./overview"
import { AiCategorization } from "./ai-categorization"
import { BudgetsInsights } from "./budgets-insights"
import { Transactions } from "./transactions"
import { AddExpenseModal } from "./add-expense-modal"
import { AuthScreen } from "./auth-screen"
import {
  apiDeleteExpense,
  apiListExpenses,
  apiLoadDemo,
  apiMe,
  apiUpdateBudget,
  apiUpdateExpense,
  clearToken,
  isLoggedIn,
  type Expense,
} from "@/lib/api"
import { toast } from "@/hooks/use-toast"

const TITLES: Record<NavId, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "Your spending at a glance, powered by AI" },
  transactions: { title: "Transactions", subtitle: "Every charge, auto-categorized" },
  insights: { title: "AI Insights", subtitle: "Categorization queue and smart observations" },
  budgets: { title: "Budgets", subtitle: "Stay on track across every category" },
  categories: { title: "Categories", subtitle: "Manage how spending is grouped" },
  settings: { title: "Settings", subtitle: "Preferences and account" },
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card py-20 text-center shadow-soft">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        <Construction className="size-6" />
      </div>
      <p className="font-display text-sm font-bold text-foreground">{label} is a prototype view</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        This screen is part of the design mockup. Hook it up to your backend to bring it to life.
      </p>
    </div>
  )
}

export default function Dashboard() {
  const [nav, setNav] = useState<NavId>("overview")
  const [addOpen, setAddOpen] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [expenses, setExpenses] = useState<Expense[] | null>(null)
  const [expensesError, setExpensesError] = useState<string | null>(null)
  const [budget, setBudget] = useState(0)
  const [demoBusy, setDemoBusy] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const meta = TITLES[nav]

  // localStorage only exists on the client, so the login check must happen
  // after mount (SSR renders the same first frame -> no hydration mismatch)
  useEffect(() => {
    const onChange = () => setAuthed(isLoggedIn())
    onChange()
    window.addEventListener("auth:changed", onChange)
    return () => window.removeEventListener("auth:changed", onChange)
  }, [])

  // Load the user's real expenses (single fetch shared by Overview + Transactions).
  // refreshKey bumps after every save, demo load, etc. -> refetch.
  const loadExpenses = useCallback(async () => {
    try {
      setExpenses(await apiListExpenses())
      setExpensesError(null)
    } catch (err) {
      setExpensesError(err instanceof Error ? err.message : "Failed to load expenses")
    }
  }, [])

  useEffect(() => {
    if (!authed) return
    loadExpenses()
    apiMe()
      .then((me) => setBudget(me.monthly_budget ?? 0))
      .catch(() => {})
  }, [authed, refreshKey, loadExpenses])

  // ── real Overview stats, computed from the expenses we just fetched ──
  const monthKey = new Date().toISOString().slice(0, 7) // e.g. "2026-08"
  const monthExpenses = (expenses ?? []).filter((e) => e.date.startsWith(monthKey))

  // ── AI Categorization queue: everything the user hasn't reviewed yet ──
  const pendingReview = (expenses ?? []).filter((e) => !e.reviewed)

  const handleSaveBudget = async (value: number) => {
    try {
      const me = await apiUpdateBudget(value)
      setBudget(me.monthly_budget)
      toast({ description: "Monthly budget saved" })
    } catch (err) {
      toast({ description: err instanceof Error ? err.message : "Failed to save budget", variant: "destructive" })
    }
  }

  const handleDeleteExpense = async (id: number) => {
    setDeletingId(id)
    try {
      await apiDeleteExpense(id)
      setExpenses((prev) => (prev ? prev.filter((e) => e.id !== id) : prev))
      toast({ description: "Expense deleted" })
    } catch (err) {
      toast({ description: err instanceof Error ? err.message : "Failed to delete expense", variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }

  const handleReview = async (id: number, category: string) => {
    try {
      const updated = await apiUpdateExpense(id, { category, reviewed: true })
      setExpenses((prev) => (prev ? prev.map((e) => (e.id === id ? updated : e)) : prev))
      toast({ description: "Expense reviewed" })
    } catch (err) {
      toast({ description: err instanceof Error ? err.message : "Failed to review expense", variant: "destructive" })
    }
  }

  const handleLoadDemo = async () => {
    if (demoBusy) return
    setDemoBusy(true)
    try {
      await apiLoadDemo()
      toast({ description: "Demo data loaded — it will be replaced by your own once you add expenses" })
      setRefreshKey((k) => k + 1)
    } catch (err) {
      toast({ description: err instanceof Error ? err.message : "Failed to load demo data", variant: "destructive" })
    } finally {
      setDemoBusy(false)
    }
  }

  if (!authed) {
    return <AuthScreen onAuthed={() => setAuthed(true)} />
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar active={nav} onChange={setNav} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onAdd={() => setAddOpen(true)} onLogout={() => clearToken()} />

        <main className="flex-1 px-5 py-6 lg:px-8">
          <motion.div
            key={nav}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto flex max-w-6xl flex-col gap-5"
          >
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">{meta.title}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">{meta.subtitle}</p>
            </div>

            {nav === "overview" && (
              <>
                <Overview
                  expenses={monthExpenses}
                  budget={budget}
                  onSaveBudget={handleSaveBudget}
                />
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <AiCategorization pending={pendingReview} onReview={handleReview} />
                  <div className="flex flex-col gap-5">
                    <Transactions
                      expenses={expenses}
                      error={expensesError}
                      demoBusy={demoBusy}
                      onLoadDemo={handleLoadDemo}
                      onDelete={handleDeleteExpense}
                      deletingId={deletingId}
                    />
                  </div>
                </div>
                <BudgetsInsights />
              </>
            )}

            {nav === "transactions" && (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Transactions
                  expenses={expenses}
                  error={expensesError}
                  demoBusy={demoBusy}
                  onLoadDemo={handleLoadDemo}
                  onDelete={handleDeleteExpense}
                  deletingId={deletingId}
                />
                <AiCategorization pending={pendingReview} onReview={handleReview} />
              </div>
            )}

            {nav === "insights" && (
              <>
                <AiCategorization pending={pendingReview} onReview={handleReview} />
                <BudgetsInsights />
              </>
            )}

            {nav === "budgets" && <BudgetsInsights />}

            {(nav === "categories" || nav === "settings") && <Placeholder label={meta.title} />}
          </motion.div>
        </main>
      </div>

      <AddExpenseModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={() => setRefreshKey((k) => k + 1)} />
    </div>
  )
}
