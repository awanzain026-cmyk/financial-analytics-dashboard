// AI Expense Tracker — API client (Stage 6: wire the UI to the Python backend).
//
// The Next.js app never talks to the LLM or the database directly.
// It only talks to OUR backend, which does all of that server-side.
// The JWT from login is stored in localStorage and attached to every request.

// Strip a trailing slash from the base so `${API_BASE}${path}` never becomes
// `host//auth/login` (FastAPI returns 404 for the double slash).
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "")
const TOKEN_KEY = "expense_token"

export type Expense = {
  id: number
  amount: number
  description: string
  date: string
  category: string
  confidence: number
}

export type CategoryGuess = {
  category: string
  confidence: number
}

export type Me = {
  user_id: number
  email: string
  monthly_budget: number
}

// ─── token helpers ───
export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
  window.dispatchEvent(new Event("auth:changed"))
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  window.dispatchEvent(new Event("auth:changed"))
}

export function isLoggedIn(): boolean {
  return !!getToken()
}

// ─── core fetch wrapper ───
async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (res.status === 401) clearToken() // expired/invalid token -> force re-login

  if (!res.ok) {
    const detail = await res.json().catch(() => null)
    throw new Error(detail?.detail ?? `Request failed (${res.status})`)
  }
  return res.json()
}

// ─── auth ───
export function apiSignup(email: string, password: string) {
  return api<{ access_token: string }>("/auth/signup", { method: "POST", body: { email, password } })
}

export function apiLogin(email: string, password: string) {
  return api<{ access_token: string }>("/auth/login", { method: "POST", body: { email, password } })
}

// ─── expenses ───
export function apiCategorize(description: string): Promise<CategoryGuess> {
  return api<CategoryGuess>("/categorize", { method: "POST", body: { description } })
}

export function apiCreateExpense(expense: {
  amount: number
  description: string
  date: string
}): Promise<Expense> {
  return api<Expense>("/expenses", { method: "POST", body: expense })
}

export function apiListExpenses(): Promise<Expense[]> {
  return api<Expense[]>("/expenses")
}

export function apiDeleteExpense(id: number): Promise<void> {
  return api<{ ok: boolean }>(`/expenses/${id}`, { method: "DELETE" }).then(() => undefined)
}

// ─── budget + demo data ───
export function apiMe(): Promise<Me> {
  return api<Me>("/auth/me")
}

export function apiUpdateBudget(monthly_budget: number): Promise<Me> {
  return api<Me>("/budget", { method: "PUT", body: { monthly_budget } })
}

export function apiLoadDemo(): Promise<Expense[]> {
  return api<Expense[]>("/expenses/demo", { method: "POST" })
}