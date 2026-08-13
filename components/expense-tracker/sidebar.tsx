"use client"

import { motion } from "motion/react"
import {
  LayoutDashboard,
  ArrowLeftRight,
  Sparkles,
  Target,
  PieChart,
  Settings,
  Wallet,
  type LucideIcon,
} from "lucide-react"

export type NavId = "overview" | "transactions" | "insights" | "budgets" | "categories" | "settings"

const NAV: { id: NavId; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { id: "insights", label: "AI Insights", icon: Sparkles },
  { id: "budgets", label: "Budgets", icon: Target },
  { id: "categories", label: "Categories", icon: PieChart },
  { id: "settings", label: "Settings", icon: Settings },
]

export function Sidebar({
  active,
  onChange,
  pendingCount,
}: {
  active: NavId
  onChange: (id: NavId) => void
  pendingCount: number
}) {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col gap-1 border-r border-sidebar-border bg-sidebar px-4 py-6">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 pb-6">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
          <Wallet className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-base font-bold tracking-tight text-sidebar-foreground">Ledgerly</p>
          <p className="text-[11px] font-medium text-muted-foreground">AI Expense Tracker</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const isActive = active === item.id
          const badge = item.id === "insights" ? pendingCount : 0
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "text-sidebar-primary-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl bg-sidebar-primary shadow-soft"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <item.icon className="relative z-10 size-[18px]" />
              <span className="relative z-10 flex-1 text-left">{item.label}</span>
              {badge > 0 && (
                <span
                  className={`relative z-10 flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    isActive ? "bg-white/25 text-white" : "bg-primary/12 text-primary"
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Upgrade card */}
      <div className="mt-auto rounded-2xl border border-sidebar-border bg-card p-4 shadow-soft">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <p className="font-display text-sm font-semibold text-foreground">Ledgerly Pro</p>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Unlock unlimited AI categorization and forecasting.
        </p>
        <button className="mt-3 w-full rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90">
          Upgrade
        </button>
      </div>
    </aside>
  )
}
