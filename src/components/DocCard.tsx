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

export function DocCard({
  doc,
  onDelete,
}: {
  doc: Document
  onDelete: () => void
}) {
  const info = FILE_ICONS[doc.fileType] || FILE_ICONS.txt

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
        <h4 className="text-sm font-semibold text-ink truncate">{doc.fileName || doc.title}</h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] font-medium text-ink-muted uppercase">{doc.fileType}</span>
          <span className="text-[11px] text-ink-faint">·</span>
          <span className="text-[11px] text-ink-faint">{formatSize(doc.fileSize)}</span>
          {doc.title !== doc.fileName && (
            <>
              <span className="text-[11px] text-ink-faint">·</span>
              <span className="text-[11px] text-ink-faint truncate">{doc.title}</span>
            </>
          )}
          <span className="text-[11px] text-ink-faint">·</span>
          <span className="text-[11px] text-ink-faint">
            {new Date(doc.createdAt).toLocaleDateString("zh-CN")}
          </span>
        </div>
      </div>

      {/* 删除按钮 - 始终可见 */}
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
