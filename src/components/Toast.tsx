import { useEffect } from "react"
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
        "px-[18px] py-2.5 text-xs font-semibold text-white rounded-md shadow-[0_4px_16px_rgba(0,0,0,0.12)]",
        "pointer-events-auto max-w-[280px] animate-toast-in",
        toast.type === "success" && "bg-wasabi",
        toast.type === "error" && "bg-red-500",
        toast.type === "info" && "bg-persimmon"
      )}
    >
      {toast.message}
    </div>
  )
}
