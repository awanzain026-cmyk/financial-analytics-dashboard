"use client"

import { useCallback, useEffect, useState } from "react"
import { motion } from "motion/react"
import { Sidebar, type NavId } from "./sidebar"
import { TopBar } from "./topbar"
import { Overview } from "./overview"
import { AiCategorization } from "./ai-categorization"
import { BudgetsInsights } from "./budgets-insights"
import { Transactions } from "./transactions"
import { Categories } from "./categories"
import { Settings } from "./settings"
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
  type Me,
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

export default function Dashboard() {
  const [nav, setNav] = useState<NavId>("overview")
  const [addOpen, setAddOpen] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [expenses, setExpenses] = useState<Expense[] | null>(null)
  const [expensesError, setExpensesError] = useState<string | null>(null)
  const [me, setMe] = useState<Me | null>(null)
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
      .then(setMe)
      .catch(() => {})
  }, [authed, refreshKey, loadExpenses])

  // ── real Overview stats, computed from the expenses we just fetched ──
  const monthKey = new Date().toISOString().slice(0, 7) // e.g. "2026-08"
  const monthExpenses = (expenses ?? []).filter((e) => e.date.startsWith(monthKey))

  // ── AI Categorization queue: everything the user hasn't reviewed yet ──
  const pendingReview = (expenses ?? []).filter((e) => !e.reviewed)

  const budget = me?.monthly_budget ?? 0
  const email = me?.email ?? ""

  const handleSaveBudget = async (value: number) => {
    try {
      const updated = await apiUpdateBudget(value)
      setMe(updated)
      toast({ description: "Monthly budget saved" })
    } catch (err) {
      toast({ description: err instanceof Error ? err.message : "Failed to save budget", variant: "destructive" })
    }
  }

  const handleLogout = () => clearToken()

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
      <Sidebar active={nav} onChange={setNav} pendingCount={pendingReview.length} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onAdd={() => setAddOpen(true)} onLogout={handleLogout} email={email} />

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
                <BudgetsInsights
                  expenses={monthExpenses}
                  budget={budget}
                  pendingCount={pendingReview.length}
                  onSaveBudget={handleSaveBudget}
                />
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
                <BudgetsInsights
                  expenses={monthExpenses}
                  budget={budget}
                  pendingCount={pendingReview.length}
                  onSaveBudget={handleSaveBudget}
                />
              </>
            )}

            {nav === "budgets" && (
              <BudgetsInsights
                expenses={monthExpenses}
                budget={budget}
                pendingCount={pendingReview.length}
                onSaveBudget={handleSaveBudget}
              />
            )}

            {nav === "categories" && <Categories expenses={monthExpenses} />}

            {nav === "settings" && (
              <Settings
                email={email}
                budget={budget}
                expenseCount={expenses?.length ?? 0}
                onSaveBudget={handleSaveBudget}
                onLogout={handleLogout}
              />
            )}
          </motion.div>
        </main>
      </div>

      <AddExpenseModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={() => setRefreshKey((k) => k + 1)} />
    </div>
  )
}
