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

export function formatCurrency(n: number, opts?: { cents?: boolean }) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts?.cents === false ? 0 : 2,
    maximumFractionDigits: opts?.cents === false ? 0 : 2,
  })
}
