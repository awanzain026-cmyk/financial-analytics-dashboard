"use client"

import { Search, Plus, Bell, Sparkles } from "lucide-react"

export function TopBar({ onAdd }: { onAdd: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 px-5 py-4 backdrop-blur-md lg:px-8">
      {/* Mobile brand */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </div>
        <span className="font-display text-base font-bold">Ledgerly</span>
      </div>

      {/* Search */}
      <div className="relative hidden flex-1 max-w-md sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search transactions, merchants…"
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          className="relative flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="size-[18px]" />
          <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-fin-warning ring-2 ring-card" />
        </button>

        <button
          onClick={onAdd}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Add expense</span>
        </button>

        <button
          className="flex size-10 items-center justify-center overflow-hidden rounded-xl border border-border bg-accent font-semibold text-accent-foreground"
          aria-label="Account"
        >
          MC
        </button>
      </div>
    </header>
  )
}
