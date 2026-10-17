import type {
  ChatMessage,
  User,
  ConversationSummary,
  ApiMessageItem,
  KnowledgeBaseSummary,
  Document,
  ModelOption,
  RAGSource,
} from "@/types"
import {
  getChatURL,
  getRagChatURL,
  getLoginURL,
  getConversationsURL,
  getConversationURL,
  getMessagesURL,
  getKnowledgeBasesURL,
  getKnowledgeBaseURL,
  getDocumentsURL,
  getDocumentURL,
  getModelsURL,
} from "@/config"
import { loadToken } from "@/services/storage"

// ========== 通用工具 ==========

/** 带 Authorization 的请求头 */
function authHeaders(): Record<string, string> {
  const token = loadToken()
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/** 不带 Content-Type 的认证头（FormData 上传用） */
function authHeadersNoCT(): Record<string, string> {
  const token = loadToken()
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/** 提取错误消息 */
async function extractError(response: Response): Promise<string> {
  const text = await response.text().catch(() => "")
  try {
    const json = JSON.parse(text)
    return json.message || json.detail || `请求失败 (${response.status})`
  } catch {
    return text || `请求失败 (${response.status})`
  }
}

// ========== 登录 ==========

/** 调用后端登录接口 */
export async function loginAPI(
  user_id: string,
  password: string,
): Promise<User> {
  const response = await fetch(getLoginURL(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, password }),
  })

  if (!response.ok) {
    throw new Error(await extractError(response))
  }

  const result = await response.json()

  // 后端通过 code 区分成败，code === 0 才是成功
  if (result.code !== 0) {
    throw new Error(result.message || "账号或密码错误")
  }

  const data = result.data || {}
  return {
    username: data.username || data.user_id || user_id,
    token: data.access_token || data.token || "",
    nickname: data.nickname || "",
  }
}

// ========== 会话管理 ==========

/** 获取会话列表 */
export async function fetchConversations(): Promise<ConversationSummary[]> {
  const response = await fetch(getConversationsURL(), {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(await extractError(response))
  }

  const result = await response.json()
  if (result.code !== 0) {
    throw new Error(result.message || "获取会话列表失败")
  }

  return result.data || []
}

/** 创建新会话 */
export async function createConversation(
  title = "新对话",
): Promise<ConversationSummary> {
  const response = await fetch(getConversationsURL(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ title }),
  })

  if (!response.ok) {
    throw new Error(await extractError(response))
  }

  const result = await response.json()
  if (result.code !== 0) {
    throw new Error(result.message || "创建会话失败")
  }

  return result.data
}

/** 删除会话 */
export async function deleteConversation(conversationId: string): Promise<void> {
  const response = await fetch(getConversationURL(conversationId), {
    method: "DELETE",
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(await extractError(response))
  }

  const result = await response.json()
  if (result.code !== 0) {
    throw new Error(result.message || "删除会话失败")
  }
}

/** 获取指定会话的消息列表 */
export async function fetchMessages(
  conversationId: string,
): Promise<ApiMessageItem[]> {
  const response = await fetch(getMessagesURL(conversationId), {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(await extractError(response))
  }

  const result = await response.json()
  if (result.code !== 0) {
    throw new Error(result.message || "获取消息失败")
  }

  return result.data || []
}

// ========== 模型管理 ==========

/** 获取可用模型列表（默认 chat 类型，来自 tj_models 表） */
export async function fetchModels(modelType = "chat"): Promise<ModelOption[]> {
  const response = await fetch(`${getModelsURL()}?model_type=${encodeURIComponent(modelType)}`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(await extractError(response))
  }

  const result = await response.json()
  if (result.code !== 0) {
    throw new Error(result.message || "获取模型列表失败")
  }

  return result.data || []
}

// ========== 聊天（流式）==========

/** 将后端 ApiMessageItem[] 转为前端 ChatMessage[] */
export function toChatMessages(items: ApiMessageItem[]): ChatMessage[] {
  return items.map((m) => ({
    id: m.id,
    role: m.role === "assistant" ? "ai" : ("user" as const),
    text: m.content,
    reasoning: m.reasoning || undefined,
    hasSource: false,
    sources: null,
    time: m.created_at,
  }))
}

/**
 * 流式调用聊天 API
 * 只发送当前消息 + conversation_id，历史由后端处理
 * @param conversationId 会话 ID
 * @param message 用户当前消息文本
 * @param onChunk 每收到一个文本块时回调
 * @param signal 可选 AbortSignal，用于取消请求
 * @param thinking 是否开启深度思考
 * @param model 用户选择的模型 ID（空则后端用 tj_models 默认模型）
 * @returns 完整响应文本
 */
export async function chatStream(
  conversationId: string,
  message: string,
  onChunk: (chunk: { content?: string; reasoning?: string; sources?: RAGSource[] }) => void,
  signal?: AbortSignal,
  thinking?: boolean,
  model?: string,
  images?: string[],
): Promise<string> {
  const response = await fetch(getChatURL(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      conversation_id: conversationId,
      message,
      ...(images && images.length > 0 ? { images } : {}),
      ...(thinking ? { thinking: true } : {}),
      ...(model ? { model } : {}),
    }),
    signal,
  })

  if (!response.ok) {
    throw new Error(await extractError(response))
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error("不支持流式响应")

  const decoder = new TextDecoder()
  let fullText = ""
  let buffer = ""

  // 兜底：每个 read 加一个独立的超时（默认 90s），避免上游不发 [DONE] 时永久阻塞
  const CHUNK_TIMEOUT_MS = 90_000

  try {
    while (true) {
      // 提前检查是否已被取消
      if (signal?.aborted) break

      // read 阶段单独加超时：超时后主动 cancel reader 并抛错
      const readPromise = reader.read()
      const timeoutPromise = new Promise<{ __timeout: true }>((resolve) =>
        setTimeout(() => resolve({ __timeout: true }), CHUNK_TIMEOUT_MS),
      )
      const result = await Promise.race([readPromise, timeoutPromise])

      if ("__timeout" in result) {
        try { await reader.cancel() } catch { /* ignore */ }
        throw new Error("模型响应超时，请稍后重试")
      }

      const { done, value } = result
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith("data: ")) continue

        const data = trimmed.slice(6)
        if (data === "[DONE]") return fullText

        try {
          const chunk = JSON.parse(data)
          const delta = chunk.choices?.[0]?.delta
          const content: string | undefined = delta?.content
          const reasoning: string | undefined = delta?.reasoning_content
          const sources: RAGSource[] | undefined = delta?.sources
          if (sources && sources.length > 0) {
            onChunk({ sources })
          }
          if (content || reasoning) {
            if (content) fullText += content
            onChunk({ content, reasoning })
          }
        } catch {
          // 跳过无法解析的行
        }
      }
    }
  } finally {
    // 异常/取消分支也释放 reader
    try { reader.cancel() } catch { /* 忽略 */ }
  }
  return fullText
}

/**
 * RAG 增强流式聊天
 * 调用 /api/v1/rag/chat，携带 kb_ids 和 use_rag 参数
 * @param conversationId 会话 ID
 * @param message 用户当前消息文本
 * @param kbIds 选中的知识库 ID 列表
 * @param onChunk 每收到一个文本块时回调
 * @param signal 可选 AbortSignal，用于取消请求
 * @param thinking 是否开启深度思考
 * @param model 用户选择的模型 ID（空则后端用 tj_models 默认模型）
 * @returns 完整响应文本
 */
export async function ragChatStream(
  conversationId: string,
  message: string,
  kbIds: string[],
  onChunk: (chunk: { content?: string; reasoning?: string; sources?: RAGSource[] }) => void,
  signal?: AbortSignal,
  thinking?: boolean,
  model?: string,
  images?: string[],
): Promise<string> {
  const response = await fetch(getRagChatURL(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      conversation_id: conversationId,
      message,
      kb_ids: kbIds,
      use_rag: true,
      ...(images && images.length > 0 ? { images } : {}),
      ...(thinking ? { thinking: true } : {}),
      ...(model ? { model } : {}),
    }),
    signal,
  })

  if (!response.ok) {
    throw new Error(await extractError(response))
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error("不支持流式响应")

  const decoder = new TextDecoder()
  let fullText = ""
  let buffer = ""

  // 兜底：每个 read 加一个独立的超时（默认 90s），避免上游不发 [DONE] 时永久阻塞
  const CHUNK_TIMEOUT_MS = 90_000

  try {
    while (true) {
      // 提前检查是否已被取消
      if (signal?.aborted) break

      // read 阶段单独加超时：超时后主动 cancel reader 并抛错
      const readPromise = reader.read()
      const timeoutPromise = new Promise<{ __timeout: true }>((resolve) =>
        setTimeout(() => resolve({ __timeout: true }), CHUNK_TIMEOUT_MS),
      )
      const result = await Promise.race([readPromise, timeoutPromise])

      if ("__timeout" in result) {
        try { await reader.cancel() } catch { /* ignore */ }
        throw new Error("模型响应超时，请稍后重试")
      }

      const { done, value } = result
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith("data: ")) continue

        const data = trimmed.slice(6)
        if (data === "[DONE]") return fullText

        try {
          const chunk = JSON.parse(data)
          const delta = chunk.choices?.[0]?.delta
          const content: string | undefined = delta?.content
          const reasoning: string | undefined = delta?.reasoning_content
          const sources: RAGSource[] | undefined = delta?.sources
          if (sources && sources.length > 0) {
            onChunk({ sources })
          }
          if (content || reasoning) {
            if (content) fullText += content
            onChunk({ content, reasoning })
          }
        } catch {
          // 跳过无法解析的行
        }
      }
    }
  } finally {
    // 异常/取消分支也释放 reader
    try { reader.cancel() } catch { /* 忽略 */ }
  }
  return fullText
}

// ========== 知识库管理 ==========

/** 获取知识库列表 */
export async function fetchKnowledgeBases(): Promise<KnowledgeBaseSummary[]> {
  const response = await fetch(getKnowledgeBasesURL(), {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(await extractError(response))
  }

  const result = await response.json()
  if (result.code !== 0) {
    throw new Error(result.message || "获取知识库列表失败")
  }

  return result.data || []
}

/** 创建知识库 */
export async function apiCreateKB(
  name: string,
  description: string,
): Promise<KnowledgeBaseSummary> {
  const response = await fetch(getKnowledgeBasesURL(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name, description }),
  })

  if (!response.ok) {
    throw new Error(await extractError(response))
  }

  const result = await response.json()
  if (result.code !== 0) {
    throw new Error(result.message || "创建知识库失败")
  }

  return result.data
}

/** 删除知识库 */
export async function apiDeleteKB(kbId: string): Promise<void> {
  const response = await fetch(getKnowledgeBaseURL(kbId), {
    method: "DELETE",
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(await extractError(response))
  }

  const result = await response.json()
  if (result.code !== 0) {
    throw new Error(result.message || "删除知识库失败")
  }
}

// ========== 文档管理 ==========

/** 获取知识库下的文档列表 */
export async function fetchDocuments(kbId: string): Promise<Document[]> {
  const response = await fetch(getDocumentsURL(kbId), {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(await extractError(response))
  }

  const result = await response.json()
  if (result.code !== 0) {
    throw new Error(result.message || "获取文档列表失败")
  }

  return result.data || []
}

/** 上传文档到知识库 */
export async function apiUploadDocument(
  kbId: string,
  file: File,
): Promise<Document> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(getDocumentsURL(kbId), {
    method: "POST",
    headers: authHeadersNoCT(),
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await extractError(response))
  }

  const result = await response.json()
  if (result.code !== 0) {
    throw new Error(result.message || "上传文档失败")
  }

  return result.data
}

/** 获取单个文档详情（含 content_text 用于预览） */
export async function fetchDocumentContent(docId: string): Promise<{
  title: string
  content: string
  parse_status: number
}> {
  const response = await fetch(getDocumentURL(docId), {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(await extractError(response))
  }

  const result = await response.json()
  if (result.code !== 0) {
    throw new Error(result.message || "获取文档失败")
  }

  return {
    title: result.data.title || result.data.file_name || "",
    content: result.data.content_text || "",
    parse_status: result.data.parse_status ?? 0,
  }
}

/** 删除文档 */
export async function apiDeleteDocument(docId: string): Promise<void> {
  const response = await fetch(getDocumentURL(docId), {
    method: "DELETE",
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(await extractError(response))
  }

  const result = await response.json()
  if (result.code !== 0) {
    throw new Error(result.message || "删除文档失败")
  }
}
