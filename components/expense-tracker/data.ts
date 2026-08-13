import {
  ShoppingCart,
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Receipt,
  Clapperboard,
  HeartPulse,
  Repeat,
  type LucideIcon,
} from "lucide-react"

// ─── Category system ────────────────────────────────────────────

export type CategoryId =
  | "groceries"
  | "dining"
  | "transport"
  | "shopping"
  | "bills"
  | "entertainment"
  | "health"
  | "subscriptions"

export type Category = {
  id: CategoryId
  label: string
  icon: LucideIcon
  /** chart token used for fills / text */
  color: string
}

export const CATEGORIES: Record<CategoryId, Category> = {
  groceries: { id: "groceries", label: "Groceries", icon: ShoppingCart, color: "var(--chart-1)" },
  dining: { id: "dining", label: "Dining", icon: UtensilsCrossed, color: "var(--chart-3)" },
  transport: { id: "transport", label: "Transport", icon: Car, color: "var(--chart-2)" },
  shopping: { id: "shopping", label: "Shopping", icon: ShoppingBag, color: "var(--chart-5)" },
  bills: { id: "bills", label: "Bills & Utilities", icon: Receipt, color: "var(--chart-4)" },
  entertainment: { id: "entertainment", label: "Entertainment", icon: Clapperboard, color: "var(--chart-3)" },
  health: { id: "health", label: "Health", icon: HeartPulse, color: "var(--fin-positive)" },
  subscriptions: { id: "subscriptions", label: "Subscriptions", icon: Repeat, color: "var(--chart-5)" },
}

export const CATEGORY_LIST = Object.values(CATEGORIES)

// ─── KPIs ───────────────────────────────────────────────────────

export const KPIS = {
  spentThisMonth: 3248.72,
  spentChange: 8.4, // % vs last month (positive = spent more)
  budget: 4200,
  income: 6100,
  savingsRate: 22.4,
  savingsChange: 3.1,
  transactionsCount: 128,
}

// ─── Budgets ────────────────────────────────────────────────────

export const BUDGETS: { id: CategoryId; spent: number; limit: number }[] = [
  { id: "groceries", spent: 720, limit: 800 },
  { id: "dining", spent: 540, limit: 500 },
  { id: "bills", spent: 610, limit: 700 },
  { id: "shopping", spent: 468, limit: 400 },
  { id: "transport", spent: 310, limit: 450 },
]

// ─── AI Insights ────────────────────────────────────────────────

export type Insight = {
  id: number
  tone: "positive" | "warning" | "neutral"
  title: string
  body: string
}

export const INSIGHTS: Insight[] = [
  {
    id: 1,
    tone: "warning",
    title: "Dining is trending over budget",
    body: "You've spent $540 on dining — 8% above your $500 limit with 3 days left in the month.",
  },
  {
    id: 2,
    tone: "positive",
    title: "Transport spending is down 19%",
    body: "Switching to a transit pass saved you roughly $72 compared to last month's rides.",
  },
  {
    id: 3,
    tone: "neutral",
    title: "4 subscriptions renew this week",
    body: "Netflix, Spotify, iCloud and Figma total $58.96. Two haven't been used in 30+ days.",
  },
]

// ─── Recent (already-categorized) transactions ─────────────────

export type Transaction = {
  id: number
  merchant: string
  category: CategoryId
  amount: number
  date: string
  auto: boolean // categorized automatically by AI
}

export const TRANSACTIONS: Transaction[] = [
  { id: 1, merchant: "Trader Joe's", category: "groceries", amount: 62.38, date: "Mar 27", auto: true },
  { id: 2, merchant: "Uber", category: "transport", amount: 18.5, date: "Mar 27", auto: true },
  { id: 3, merchant: "Chipotle", category: "dining", amount: 14.2, date: "Mar 26", auto: true },
  { id: 4, merchant: "Amazon", category: "shopping", amount: 129.99, date: "Mar 26", auto: true },
  { id: 5, merchant: "PG&E", category: "bills", amount: 142.6, date: "Mar 25", auto: false },
  { id: 6, merchant: "Spotify", category: "subscriptions", amount: 11.99, date: "Mar 25", auto: true },
  { id: 7, merchant: "AMC Theatres", category: "entertainment", amount: 32.0, date: "Mar 24", auto: true },
  { id: 8, merchant: "Walgreens", category: "health", amount: 27.84, date: "Mar 24", auto: true },
  { id: 9, merchant: "Safeway", category: "groceries", amount: 74.11, date: "Mar 23", auto: true },
  { id: 10, merchant: "Lyft", category: "transport", amount: 22.75, date: "Mar 23", auto: false },
]

export function formatCurrency(n: number, opts?: { cents?: boolean }) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts?.cents === false ? 0 : 2,
    maximumFractionDigits: opts?.cents === false ? 0 : 2,
  })
}
