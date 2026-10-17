import { useState } from "react"
import type { KnowledgeBase } from "@/types"
import { useApp } from "@/components/AppContext"
import { deleteKnowledgeBase } from "@/hooks/useApp"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { AlertDialog } from "@/components/AlertDialog"
import { cn } from "@/lib/utils"

const ICONS = ["🍽️", "📋", "🧾", "🍳", "🥗", "🍰", "☕", "📊", "🔖", "📖"]

export function KBCard({ kb, index }: { kb: KnowledgeBase; index: number }) {
  const { state, dispatch } = useApp()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)

  const handleClick = () => {
    dispatch({ type: "SWITCH_VIEW", view: "kb-detail", kbId: kb.id })
  }

  const handleDelete = async () => {
    setConfirmOpen(false)
    try {
      await deleteKnowledgeBase(kb.id, dispatch)
      dispatch({
        type: "ADD_TOAST",
        toast: { id: Date.now().toString(), message: `知识库「${kb.name}」已删除`, type: "info" },
      })
    } catch {
      // 错误已在 deleteKnowledgeBase 中处理
    }
  }

  return (
    <div
      onClick={handleClick}
      className="group relative overflow-hidden bg-white border border-thread-light rounded-xl p-5 cursor-pointer transition-all duration-200 hover:border-sprout hover:shadow-[0_12px_32px_rgba(45,39,32,0.08),0_1px_0_rgba(224,85,31,0.25)] hover:-translate-y-0.5 active:scale-[0.98] active:shadow-[0_2px_8px_rgba(45,39,32,0.06)]"
    >
      {/* 顶部品牌渐变细线 */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-persimmon via-sprout to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      <div className="flex flex-col gap-2.5">
        <div className="text-[26px] w-11 h-11 flex items-center justify-center bg-parchment rounded-xl ring-1 ring-inset ring-thread-light/60">
          {ICONS[index % ICONS.length]}
        </div>

        <h3 className="font-display text-base font-bold text-ink tracking-[0.02em] group-hover:text-persimmon transition-colors">
          {kb.name}
        </h3>

        <p className="text-xs text-ink-muted leading-relaxed min-h-[36px]">
          {kb.description || "暂无描述"}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-xs font-semibold text-wasabi flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sprout shadow-[0_0_0_3px_rgba(137,168,126,0.18)]" />
            {kb.docCount} 篇文档
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation()
              if (kb.docCount > 0) {
                setAlertOpen(true)
              } else {
                setConfirmOpen(true)
              }
            }}
            className={cn(
              "w-7 h-7 rounded-md flex items-center justify-center text-sm text-ink-faint opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-500 active:scale-90"
            )}
            title="删除"
          >
            ×
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="删除知识库"
        message={`确定删除知识库「${kb.name}」吗？删除后不可恢复。`}
        confirmText="删除"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <AlertDialog
        open={alertOpen}
        title="无法删除知识库"
        message={`知识库「${kb.name}」下还有 ${kb.docCount} 篇文档。\n请先删除该知识库下的所有文档，再删除知识库。`}
        confirmText="知道了"
        onConfirm={() => setAlertOpen(false)}
      />
    </div>
  )
}
