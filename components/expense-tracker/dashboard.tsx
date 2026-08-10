"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Construction } from "lucide-react"
import { Sidebar, type NavId } from "./sidebar"
import { TopBar } from "./topbar"
import { Overview } from "./overview"
import { AiCategorization } from "./ai-categorization"
import { BudgetsInsights } from "./budgets-insights"
import { Transactions } from "./transactions"
import { AddExpenseModal } from "./add-expense-modal"

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
  const meta = TITLES[nav]

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar active={nav} onChange={setNav} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onAdd={() => setAddOpen(true)} />

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
                <Overview />
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <AiCategorization />
                  <div className="flex flex-col gap-5">
                    <Transactions />
                  </div>
                </div>
                <BudgetsInsights />
              </>
            )}

            {nav === "transactions" && (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Transactions />
                <AiCategorization />
              </div>
            )}

            {nav === "insights" && (
              <>
                <AiCategorization />
                <BudgetsInsights />
              </>
            )}

            {nav === "budgets" && <BudgetsInsights />}

            {(nav === "categories" || nav === "settings") && <Placeholder label={meta.title} />}
          </motion.div>
        </main>
      </div>

      <AddExpenseModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
