import { createContext, useContext, type Dispatch } from "react"
import type { AppState, Action } from "@/hooks/useApp"

export const AppCtx = createContext<{
  state: AppState
  dispatch: Dispatch<Action>
} | null>(null)

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
