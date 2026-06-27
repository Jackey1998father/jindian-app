import type { KnowledgeBase } from "@/types"
import { useApp } from "@/components/AppContext"
import { cn } from "@/lib/utils"

const ICONS = ["🍽️", "📋", "🧾", "🍳", "🥗", "🍰", "☕", "📊", "🔖", "📖"]

export function KBCard({ kb, index }: { kb: KnowledgeBase; index: number }) {
  const { state, dispatch } = useApp()

  const handleClick = () => {
    dispatch({ type: "SWITCH_VIEW", view: "kb-detail", kbId: kb.id })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Show confirm
    const id = Date.now().toString()
    dispatch({
      type: "ADD_TOAST",
      toast: {
        id,
        message: `确定删除「${kb.name}」吗？该知识库下所有文档也将被永久删除。`,
        type: "error",
      },
    })
    // We'll use a simpler confirm approach: double-check via browser confirm
    if (window.confirm(`确定删除知识库「${kb.name}」吗？\n该知识库下所有文档也将被永久删除。`)) {
      dispatch({ type: "DELETE_KB", id: kb.id })
      dispatch({
        type: "ADD_TOAST",
        toast: { id: Date.now().toString(), message: `知识库「${kb.name}」已删除`, type: "info" },
      })
    }
  }

  return (
    <div
      onClick={handleClick}
      className="group bg-white border border-thread-light rounded-md p-5 cursor-pointer transition-all duration-200 hover:border-persimmon hover:shadow-[0_1px_0_#E0551F,0_4px_20px_rgba(224,85,31,0.08)] hover:-translate-y-px"
    >
      <div className="flex flex-col gap-2.5">
        <div className="text-[28px] w-10 h-10 flex items-center justify-center bg-parchment rounded-md">
          {ICONS[index % ICONS.length]}
        </div>

        <h3 className="font-display text-base font-bold text-ink tracking-[0.02em]">
          {kb.name}
        </h3>

        <p className="text-xs text-ink-muted leading-relaxed min-h-[36px]">
          {kb.description || "暂无描述"}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-xs font-semibold text-wasabi flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-sprout" />
            {kb.documents.length} 篇文档
          </span>

          <button
            onClick={handleDelete}
            className={cn(
              "w-7 h-7 rounded-md flex items-center justify-center text-sm text-ink-faint opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-500"
            )}
            title="删除"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
