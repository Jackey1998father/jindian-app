import { useEffect, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-[rgba(45,39,32,0.35)] backdrop-blur-[3px] flex items-center justify-center z-[200] animate-[backdropIn_0.18s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={cn(
          "bg-white border border-thread-light rounded-[10px] p-7 w-[90%] max-w-[460px]",
          "shadow-[0_1px_0_rgba(0,0,0,0.06),0_16px_48px_rgba(45,39,32,0.15)]",
          "animate-sheet-in"
        )}
      >
        {children}
      </div>
    </div>
  )
}
