export type DocFileType = "pdf" | "txt" | "ppt" | "docx" | "doc" | "csv" | "xlsx"

/** 后端返回的文档 */
export interface Document {
  id: string
  kb_id: string
  title: string
  file_name: string
  file_type: DocFileType
  file_size: number
  parse_status: number       // 0=待解析 1=解析中 2=已完成 3=失败
  content_text?: string | null
  created_at?: string
}

/** 后端返回的知识库摘要（不含文档列表） */
export interface KnowledgeBaseSummary {
  id: string
  name: string
  description: string
  doc_count: number
  created_at?: string
  updated_at?: string
}

/** 前端用的知识库（兼容旧字段） */
export interface KnowledgeBase {
  id: string
  name: string
  description: string
  docCount: number
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  role: "user" | "ai"
  text: string
  reasoning?: string    // DeepSeek 思考过程（增强/普通模式共用）
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
