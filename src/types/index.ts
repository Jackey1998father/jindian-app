export type DocFileType = "pdf" | "txt" | "ppt" | "docx" | "doc" | "csv" | "xlsx"

export interface Document {
  id: string
  title: string
  content: string
  fileName: string
  fileType: DocFileType
  fileSize: number
  createdAt: string
}

export interface KnowledgeBase {
  id: string
  name: string
  description: string
  documents: Document[]
  createdAt: string
}

export interface ChatMessage {
  id: string
  role: "user" | "ai"
  text: string
  hasSource: boolean
  sources: string | null
  time: string
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface RAGResult {
  kb: string
  kbId: string
  title: string
  content: string
  score: number
}

export interface AppData {
  knowledgeBases: KnowledgeBase[]
  conversations: Conversation[]
}

export interface User {
  username: string
}

export type ChatMode = "normal" | "enhanced"

export type ViewType = "chat" | "kb-list" | "kb-detail"

export interface ToastItem {
  id: string
  message: string
  type: "success" | "error" | "info"
}
