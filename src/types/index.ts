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

/** 后端返回的会话摘要（列表用） */
export interface ConversationSummary {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
}

/** 后端返回的会话（含消息） */
export interface ConversationDetail {
  id: string
  title: string
  created_at: string
  updated_at: string
  messages: ApiMessageItem[]
}

/** 后端返回的单条消息 */
export interface ApiMessageItem {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

/** 前端用的会话模型（聚合 Sidebar 显示 + 消息） */
export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
  messageCount?: number
  // 标记是否已从后端加载消息
  messagesLoaded: boolean
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
  token: string
  nickname?: string
}

export type ChatMode = "normal" | "enhanced"

export type ViewType = "chat" | "kb-list" | "kb-detail"

export interface ToastItem {
  id: string
  message: string
  type: "success" | "error" | "info"
}
