import type { AppData, Conversation, User } from "@/types"

const STORAGE_KEY = "jindian_assistant"
const AUTH_KEY = "jindian_auth"

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      return {
        knowledgeBases: data.knowledgeBases || [],
        // 只保留有消息的会话
        conversations: (data.conversations || []).filter(
          (c: Conversation) => c.messages && c.messages.length > 0
        ),
      }
    }
  } catch {
    /* ignore */
  }
  return { knowledgeBases: [], conversations: [] }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

/** 持久化登录状态 */
export function saveAuth(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(AUTH_KEY)
    }
  } catch {
    /* ignore */
  }
}

/** 读取持久化的登录状态 */
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

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
