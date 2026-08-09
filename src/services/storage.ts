import type { User } from "@/types"

const AUTH_KEY = "jindian_auth"
const TOKEN_KEY = "jindian_token"

// ========== 认证 ==========

export function saveAuth(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user))
      localStorage.setItem(TOKEN_KEY, user.token)
    } else {
      localStorage.removeItem(AUTH_KEY)
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch {
    /* ignore */
  }
}

export function loadAuth(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (raw) {
      return JSON.parse(raw) as User
    }
  } catch {
    /* ignore */
  }
  return null
}

export function loadToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || ""
  } catch {
    return ""
  }
}

// ========== 工具 ==========

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
