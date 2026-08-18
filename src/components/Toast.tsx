import { useEffect, type ReactNode } from "react"
import { useApp } from "@/components/AppContext"
import { cn } from "@/lib/utils"

export function ToastContainer() {
  const { state, dispatch } = useApp()

  return (
    <div className="fixed top-[72px] right-5 flex flex-col gap-1.5 z-[300] pointer-events-none">
      {state.toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDone={() => dispatch({ type: "REMOVE_TOAST", id: toast.id })}
        />
      ))}
    </div>
  )
}

const TOAST_ICONS: Record<"success" | "error" | "info", ReactNode> = {
  success: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
}

function ToastItem({
  toast,
  onDone,
}: {
  toast: { id: string; message: string; type: "success" | "error" | "info" }
  onDone: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2400)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div
      className={cn(
        "px-4 py-3 text-xs font-semibold text-white rounded-lg shadow-[0_8px_24px_rgba(45,39,32,0.18)]",
        "pointer-events-auto max-w-[280px] animate-toast-in flex items-center gap-2 border-l-[3px]",
        toast.type === "success" && "bg-wasabi border-wasabi-light",
        toast.type === "error" && "bg-red-500 border-red-300",
        toast.type === "info" && "bg-persimmon border-persimmon-light"
      )}
    >
      <span className="flex-shrink-0">{TOAST_ICONS[toast.type]}</span>
      <span className="min-w-0">{toast.message}</span>
    </div>
  )
}
