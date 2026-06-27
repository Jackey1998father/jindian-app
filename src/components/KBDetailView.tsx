import { useState, useRef, type DragEvent, type ChangeEvent } from "react"
import { useApp } from "@/components/AppContext"
import { DocCard } from "@/components/DocCard"
import { Modal } from "@/components/Modal"
import type { DocFileType } from "@/types"

const DOC_ACCEPT = ".pdf,.txt,.ppt,.pptx,.doc,.docx"
const TABLE_ACCEPT = ".csv,.xlsx"
const DOC_LABEL = "支持 PDF · TXT · PPT · DOC · DOCX"
const TABLE_LABEL = "支持 CSV · XLSX"

function getFileType(file: File): DocFileType {
  const ext = file.name.split(".").pop()?.toLowerCase() || ""
  if (ext === "pdf") return "pdf"
  if (ext === "txt") return "txt"
  if (ext === "ppt" || ext === "pptx") return "ppt"
  if (ext === "doc") return "doc"
  if (ext === "docx") return "docx"
  if (ext === "csv") return "csv"
  if (ext === "xlsx") return "xlsx"
  return "txt"
}

async function readFileText(file: File): Promise<string> {
  // txt 和 csv 直接读取文本内容
  if (file.name.endsWith(".txt") || file.name.endsWith(".csv")) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => resolve("")
      reader.readAsText(file)
    })
  }
  // 二进制格式读取为 base64（前端预览用），实际内容标记为"已上传"
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1] || ""
      resolve(`[文件已上传] 文件名: ${file.name}\n类型: ${file.type || "未知"}\n大小: ${(file.size / 1024).toFixed(1)} KB\n\n注：${file.name.endsWith(".pdf") ? "PDF" : file.name.endsWith(".pptx") || file.name.endsWith(".ppt") ? "PPT" : "Office"} 文件已存储，文本提取需后端支持。当前可基于文件名和元数据进行检索。`)
    }
    reader.onerror = () => resolve(`[文件已上传] ${file.name}`)
    reader.readAsDataURL(file)
  })
}

export function KBDetailView() {
  const { state, dispatch } = useApp()
  const kb = state.knowledgeBases.find((k) => k.id === state.currentKBId)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadTab, setUploadTab] = useState<"doc" | "table">("doc")
  const [dragOver, setDragOver] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!kb) {
    dispatch({ type: "SWITCH_VIEW", view: "kb-list" })
    return null
  }

  const currentAccept = uploadTab === "doc" ? DOC_ACCEPT : TABLE_ACCEPT
  const currentLabel = uploadTab === "doc" ? DOC_LABEL : TABLE_LABEL

  const addFiles = (files: FileList) => {
    const list: File[] = []
    for (let i = 0; i < files.length; i++) {
      const ext = files[i].name.split(".").pop()?.toLowerCase()
      const allowed = uploadTab === "doc"
        ? ["pdf", "txt", "ppt", "pptx", "doc", "docx"]
        : ["csv", "xlsx"]
      if (ext && allowed.includes(ext)) {
        list.push(files[i])
      }
    }
    setSelectedFiles((prev) => [...prev, ...list])
  }

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(e.target.files)
      e.target.value = ""
    }
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return
    setUploading(true)

    for (const file of selectedFiles) {
      const content = await readFileText(file)
      const fileType = getFileType(file)
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
      dispatch({
        type: "ADD_DOC",
        kbId: kb.id,
        title: nameWithoutExt,
        content,
        fileName: file.name,
        fileType,
        fileSize: file.size,
      })
    }

    dispatch({
      type: "ADD_TOAST",
      toast: { id: Date.now().toString(), message: `已添加 ${selectedFiles.length} 个文档`, type: "success" },
    })

    setSelectedFiles([])
    setUploading(false)
    setShowUpload(false)
  }

  const handleDeleteDoc = (docId: string, docTitle: string) => {
    if (window.confirm(`确定删除文档「${docTitle}」吗？删除后不可恢复。`)) {
      dispatch({ type: "DELETE_DOC", kbId: kb.id, docId })
      dispatch({
        type: "ADD_TOAST",
        toast: { id: Date.now().toString(), message: `文档「${docTitle}」已删除`, type: "info" },
      })
    }
  }

  return (
    <main className="flex flex-col flex-1 overflow-hidden">
      {/* Detail header */}
      <div className="flex items-center gap-2 md:gap-3 px-3 md:px-7 py-3 md:py-3.5 border-b border-thread bg-white flex-shrink-0">
        <button
          onClick={() => dispatch({ type: "SWITCH_VIEW", view: "kb-list" })}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:bg-parchment hover:text-ink transition-colors flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <h3 className="flex-1 font-display text-[15px] md:text-[17px] font-bold text-ink tracking-[0.02em] truncate">
          {kb.name}
        </h3>

        <span className="hidden sm:inline text-xs font-medium text-ink-muted mr-1 md:mr-2">
          {kb.documents.length} 篇文档
        </span>

        <button
          onClick={() => {
            setSelectedFiles([])
            setUploadTab("doc")
            setShowUpload(true)
          }}
          className="inline-flex items-center gap-1 md:gap-1.5 px-2.5 md:px-4 py-2 text-[12px] md:text-[13px] font-semibold text-white bg-persimmon rounded-lg hover:bg-persimmon-hi hover:shadow-[0_2px_8px_rgba(224,85,31,0.2)] transition-all whitespace-nowrap"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="hidden sm:inline">上传文档</span>
          <span className="sm:hidden">上传</span>
        </button>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto p-3 md:p-5 px-4 md:px-7 custom-scroll flex flex-col gap-2 md:gap-2.5">
        {kb.documents.length === 0 ? (
          <div className="flex flex-col items-center text-center py-12 md:py-16">
            <div className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-2xl bg-parchment flex items-center justify-center text-[28px] md:text-[32px] mb-4 md:mb-5">
              📂
            </div>
            <h3 className="font-display text-[16px] md:text-[17px] font-bold text-ink mb-2">
              暂无文档
            </h3>
            <p className="text-[12px] md:text-[13px] text-ink-muted max-w-[300px] leading-relaxed mb-4 md:mb-5">
              从本地上传文档或表格文件，智能助手即可基于这些内容精准回答
            </p>
            <button
              onClick={() => {
                setSelectedFiles([])
                setUploadTab("doc")
                setShowUpload(true)
              }}
              className="inline-flex items-center gap-1.5 px-4 md:px-5 py-2 md:py-2.5 text-[12px] md:text-[13px] font-semibold text-white bg-persimmon rounded-lg hover:bg-persimmon-hi transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              上传第一个文档
            </button>
          </div>
        ) : (
          kb.documents.map((doc) => (
            <DocCard
              key={doc.id}
              doc={doc}
              onDelete={() => handleDeleteDoc(doc.id, doc.fileName || doc.title)}
            />
          ))
        )}
      </div>

      {/* Upload Modal */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)}>
        <div>
          <h4 className="font-display text-lg font-bold text-ink mb-1 tracking-[0.02em]">
            上传文档
          </h4>
          <p className="text-[13px] text-ink-muted mb-5">
            选择要添加到「{kb.name}」的文件
          </p>

          {/* 类型切换标签 */}
          <div className="flex gap-1 p-1 bg-parchment rounded-lg mb-4">
            <button
              onClick={() => {
                setUploadTab("doc")
                setSelectedFiles([])
              }}
              className={`flex-1 py-2 text-[13px] font-semibold rounded-md transition-all ${
                uploadTab === "doc"
                  ? "bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              📄 文档文件
            </button>
            <button
              onClick={() => {
                setUploadTab("table")
                setSelectedFiles([])
              }}
              className={`flex-1 py-2 text-[13px] font-semibold rounded-md transition-all ${
                uploadTab === "table"
                  ? "bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              📊 表格文件
            </button>
          </div>

          {/* 拖拽上传区域 */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 md:p-8 text-center cursor-pointer transition-all duration-200 ${
              dragOver
                ? "border-persimmon bg-persimmon/5"
                : "border-thread hover:border-sprout hover:bg-wasabi/3"
            }`}
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-parchment flex items-center justify-center text-2xl">
              {uploadTab === "doc" ? "📄" : "📊"}
            </div>
            <p className="text-sm font-semibold text-ink mb-1">
              拖拽文件到此处，或点击选择
            </p>
            <p className="text-xs text-ink-muted">
              {currentLabel}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={currentAccept}
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* 已选文件列表 */}
          {selectedFiles.length > 0 && (
            <div className="mt-4 flex flex-col gap-1.5 max-h-[180px] overflow-y-auto custom-scroll">
              {selectedFiles.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center gap-2.5 px-3 py-2 bg-parchment rounded-md"
                >
                  <span className="text-sm">
                    {file.name.endsWith(".csv") || file.name.endsWith(".xlsx") ? "📊" : "📄"}
                  </span>
                  <span className="flex-1 text-[13px] text-ink truncate">{file.name}</span>
                  <span className="text-[11px] text-ink-muted flex-shrink-0">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    onClick={() => removeFile(idx)}
                    className="w-5 h-5 rounded flex items-center justify-center text-ink-faint hover:text-red-500 hover:bg-red-50 flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 按钮 */}
          <div className="flex gap-2.5 justify-end mt-5">
            <button
              onClick={() => {
                setShowUpload(false)
                setSelectedFiles([])
              }}
              className="px-[18px] py-2.5 text-[13px] font-semibold text-ink-soft bg-parchment border border-thread rounded-md hover:bg-white transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || uploading}
              className="px-[22px] py-2.5 text-[13px] font-semibold text-white bg-persimmon rounded-md hover:bg-persimmon-hi transition-colors disabled:bg-ink-faint disabled:cursor-not-allowed"
            >
              {uploading ? "上传中…" : `上传 ${selectedFiles.length} 个文件`}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  )
}
