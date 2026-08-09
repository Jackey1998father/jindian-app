import type { Document, DocFileType } from "@/types"

const FILE_ICONS: Record<DocFileType, { emoji: string; label: string; color: string }> = {
  pdf: { emoji: "📕", label: "PDF", color: "bg-red-50 text-red-500" },
  txt: { emoji: "📄", label: "TXT", color: "bg-gray-100 text-gray-500" },
  ppt: { emoji: "📊", label: "PPT", color: "bg-orange-50 text-orange-500" },
  docx: { emoji: "📝", label: "DOCX", color: "bg-blue-50 text-blue-500" },
  doc: { emoji: "📝", label: "DOC", color: "bg-blue-50 text-blue-500" },
  csv: { emoji: "📋", label: "CSV", color: "bg-green-50 text-green-600" },
  xlsx: { emoji: "📈", label: "XLSX", color: "bg-green-50 text-green-600" },
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
}: {
  doc: Document
  onDelete: () => void
}) {
  const info = FILE_ICONS[doc.file_type] || FILE_ICONS.txt
  const statusLabel = parseStatusLabel(doc.parse_status)

  return (
    <div className="group flex items-center gap-3.5 px-[18px] py-3.5 bg-white border border-thread-light rounded-lg hover:border-sprout transition-colors">
      {/* 文件类型图标 */}
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${info.color}`}
        title={info.label}
      >
        {info.emoji}
      </div>

      {/* 文档信息 */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-ink truncate">
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
            <>
              <span className="text-[11px] text-ink-faint">·</span>
              <span className={`text-[11px] font-medium ${doc.parse_status === 3 ? "text-red-500" : "text-amber-500"}`}>
                {statusLabel}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 删除按钮 */}
      <button
        onClick={onDelete}
        className="w-[32px] h-[32px] rounded-md flex items-center justify-center text-ink-muted hover:bg-red-50 hover:text-red-500 transition-all duration-150 flex-shrink-0"
        title="删除文档"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  )
}
