import { useState } from "react"

export function GenKBForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (name: string, desc: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")

  const handleSubmit = () => {
    if (!name.trim()) return
    onSubmit(name.trim(), desc.trim())
  }

  return (
    <div>
      <h4 className="font-display text-lg font-bold text-ink mb-5 tracking-[0.02em]">
        新建知识库
      </h4>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-ink-muted mb-1.5 tracking-[0.03em] uppercase">
          名称
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="例如：菜品知识库"
          maxLength={30}
          className="w-full px-3.5 py-2.5 text-sm text-ink bg-parchment border border-thread rounded-md focus:bg-white focus:border-persimmon focus:shadow-[0_0_0_3px_rgba(224,85,31,0.06)] outline-none transition-all"
          autoFocus
        />
      </div>

      <div className="mb-2">
        <label className="block text-xs font-semibold text-ink-muted mb-1.5 tracking-[0.03em] uppercase">
          描述（选填）
        </label>
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="简要说明知识库的用途"
          maxLength={100}
          className="w-full px-3.5 py-2.5 text-sm text-ink bg-parchment border border-thread rounded-md focus:bg-white focus:border-persimmon focus:shadow-[0_0_0_3px_rgba(224,85,31,0.06)] outline-none transition-all"
        />
      </div>

      <div className="flex gap-2.5 justify-end mt-2">
        <button
          onClick={onCancel}
          className="px-[18px] py-2.5 text-[13px] font-semibold text-ink-soft bg-parchment border border-thread rounded-md hover:bg-white transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          className="px-[22px] py-2.5 text-[13px] font-semibold text-white bg-persimmon rounded-md hover:bg-persimmon-hi transition-colors"
        >
          创建
        </button>
      </div>
    </div>
  )
}
