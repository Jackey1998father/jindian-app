import { useEffect, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * 通用弹窗：打开时淡入 + 面板上浮，关闭时先播退出动画再卸载。
 * closing 期间屏蔽遮罩点击，避免动画中误触。
 */
export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
}) {
  const [rendered, setRendered] = useState(open)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (open) {
      setRendered(true)
      setClosing(false)
      return
    }
    // 关闭：先播退出动画，180ms 后再真正卸载
    setClosing(true)
    const t = setTimeout(() => {
      setRendered(false)
      setClosing(false)
    }, 180)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!rendered || closing) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [rendered, closing, onClose])

  if (!rendered) return null

  return (
    <div
      className={cn(
        "fixed inset-0 bg-overlay backdrop-blur-[3px] flex items-center justify-center z-[200]",
        closing ? "animate-[backdropOut_0.18s_ease-in_both]" : "animate-[backdropIn_0.18s_ease-out]"
      )}
      onClick={(e) => {
        if (!closing && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={cn(
          "bg-white border border-thread-light rounded-[10px] p-7 w-[90%] max-w-[460px]",
          "shadow-[0_1px_0_rgba(0,0,0,0.06),0_16px_48px_rgba(45,39,32,0.15)]",
          closing ? "animate-[sheetOut_0.18s_ease-in_both]" : "animate-sheet-in"
        )}
      >
        {children}
      </div>
    </div>
  )
}
