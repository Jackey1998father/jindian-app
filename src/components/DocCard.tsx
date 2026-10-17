import type { Document, DocFileType } from "@/types"

const FILE_ICONS: Record<DocFileType, { emoji: string; label: string; color: string }> = {
  pdf: { emoji: "📕", label: "PDF", color: "bg-persimmon-light text-persimmon" },
  txt: { emoji: "📄", label: "TXT", color: "bg-parchment text-ink-soft" },
  ppt: { emoji: "📊", label: "PPT", color: "bg-parchment text-ink-soft" },
  docx: { emoji: "📝", label: "DOCX", color: "bg-persimmon-light text-persimmon" },
  doc: { emoji: "📝", label: "DOC", color: "bg-persimmon-light text-persimmon" },
  csv: { emoji: "📋", label: "CSV", color: "bg-wasabi-light text-wasabi" },
  xlsx: { emoji: "📈", label: "XLSX", color: "bg-wasabi-light text-wasabi" },
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function parseStatusLabel(status: number): string | null {
  if (status === 0) return "待解析"
  if (status === 1) return "解析中"
  if (status === 3) return "解析失败"
  return null // status === 2 已完成后端处理，不显示标签
}

export function DocCard({
  doc,
  onDelete,
  onClick,
  selectMode = false,
  selected = false,
  onToggleSelect,
}: {
  doc: Document
  onDelete: () => void
  onClick?: () => void
  selectMode?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}) {
  const info = FILE_ICONS[doc.file_type] || FILE_ICONS.txt
  const statusLabel = parseStatusLabel(doc.parse_status)

  const handleCardClick = () => {
    if (selectMode) onToggleSelect?.()
    else onClick?.()
  }

  return (
    <div
      onClick={handleCardClick}
      className={`group flex items-center gap-3.5 px-[18px] py-3.5 bg-white border rounded-xl transition-all duration-200 ${
        selected
          ? "border-sprout bg-wasabi/5"
          : "border-thread-light hover:border-sprout hover:shadow-[0_8px_24px_rgba(45,39,32,0.06)] hover:-translate-y-0.5 active:scale-[0.985]"
      } ${selectMode || onClick ? "cursor-pointer" : ""}`}
    >
      {/* 多选模式下的选择框 */}
      {selectMode && (
        <div
          onClick={(e) => {
            e.stopPropagation()
            onToggleSelect?.()
          }}
          className={`w-[20px] h-[20px] rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
            selected ? "bg-persimmon border-persimmon text-white" : "bg-white border-thread-light hover:border-persimmon"
          }`}
        >
          {selected && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      )}

      {/* 文件类型图标 */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ring-1 ring-inset ring-white/50 ${info.color}`}
        title={info.label}
      >
        {info.emoji}
      </div>

      {/* 文档信息 */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-ink truncate group-hover:text-persimmon transition-colors">
          {doc.file_name || doc.title}
        </h4>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[11px] font-medium text-ink-muted uppercase">{doc.file_type}</span>
          <span className="text-[11px] text-ink-faint">·</span>
          <span className="text-[11px] text-ink-faint">{formatSize(doc.file_size)}</span>
          {doc.title !== doc.file_name && (
            <>
              <span className="text-[11px] text-ink-faint">·</span>
              <span className="text-[11px] text-ink-faint truncate">{doc.title}</span>
            </>
          )}
          {doc.created_at && (
            <>
              <span className="text-[11px] text-ink-faint">·</span>
              <span className="text-[11px] text-ink-faint">
                {new Date(doc.created_at).toLocaleDateString("zh-CN")}
              </span>
            </>
          )}
          {statusLabel && (
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                doc.parse_status === 3
                  ? "bg-persimmon-light text-persimmon"
                  : "bg-thinking-bg text-thinking"
              }`}
            >
              <span className={`w-1 h-1 rounded-full ${doc.parse_status === 3 ? "bg-persimmon" : "bg-thinking"}`} />
              {statusLabel}
            </span>
          )}
        </div>
      </div>

      {/* 删除按钮：多选模式下隐藏 */}
      {!selectMode && (
        <button
          onClick={onDelete}
          className="w-[32px] h-[32px] rounded-md flex items-center justify-center text-ink-faint hover:bg-red-50 hover:text-red-500 active:scale-90 transition-all duration-150 flex-shrink-0"
          title="删除文档"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      )}
    </div>
  )
}
