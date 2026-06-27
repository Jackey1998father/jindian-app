import { useApp } from "@/components/AppContext"
import { KBCard } from "@/components/KBCard"
import { Modal } from "@/components/Modal"
import { GenKBForm } from "@/components/GenKBForm"
import { useState } from "react"

export function KBListView() {
  const { state, dispatch } = useApp()
  const [showForm, setShowForm] = useState(false)

  return (
    <main className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-7 custom-scroll">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6 gap-3">
          <h2 className="font-display text-[20px] md:text-[22px] font-bold text-ink tracking-[0.02em]">
            知识库
          </h2>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-3 md:px-5 py-2 md:py-2.5 text-[12px] md:text-[13px] font-semibold text-white bg-persimmon rounded-lg hover:bg-persimmon-hi hover:-translate-y-px active:translate-y-0 transition-all duration-200 whitespace-nowrap"
          >
            <span>+</span> 新建知识库
          </button>
        </div>

        {/* Grid */}
        {state.knowledgeBases.length === 0 ? (
          <div className="flex flex-col items-center text-center py-12 md:py-16">
            <div className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-2xl bg-parchment flex items-center justify-center text-[28px] md:text-[32px] mb-4 md:mb-5">
              📭
            </div>
            <h3 className="font-display text-[16px] md:text-[17px] font-bold text-ink mb-2">
              还没有知识库
            </h3>
            <p className="text-[12px] md:text-[13px] text-ink-muted max-w-[280px] leading-relaxed mb-4 md:mb-5">
              创建知识库，开始构建专属AI知识体系
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 px-4 md:px-5 py-2 md:py-2.5 text-[12px] md:text-[13px] font-semibold text-white bg-persimmon rounded-lg hover:bg-persimmon-hi transition-all"
            >
              + 新建知识库
            </button>
          </div>
        ) : (
          <div className="grid gap-2.5 md:gap-3.5 grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
            {state.knowledgeBases.map((kb, i) => (
              <KBCard key={kb.id} kb={kb} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)}>
        <GenKBForm
          onSubmit={(name, desc) => {
            dispatch({ type: "ADD_KB", name, description: desc })
            dispatch({
              type: "ADD_TOAST",
              toast: { id: Date.now().toString(), message: `知识库「${name}」已创建`, type: "success" },
            })
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </main>
  )
}
