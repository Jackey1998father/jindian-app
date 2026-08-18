import { useReducer, useCallback, useEffect, type Dispatch } from "react"
import type {
  KnowledgeBase,
  KnowledgeBaseSummary,
  Document,
  ChatMessage,
  Conversation,
  ConversationSummary,
  ViewType,
  ToastItem,
  DocFileType,
  User,
  ChatMode,
} from "@/types"
import {
  genId,
  saveAuth,
  loadAuth,
} from "@/services/storage"
import {
  fetchConversations,
  createConversation as apiCreateConversation,
  deleteConversation as apiDeleteConversation,
  fetchMessages,
  toChatMessages,
  fetchKnowledgeBases,
  apiCreateKB,
  apiDeleteKB,
  fetchDocuments,
  apiUploadDocument,
  apiDeleteDocument,
} from "@/services/api"

// ========== State ==========

export interface AppState {
  view: ViewType
  currentKBId: string | null
  knowledgeBases: KnowledgeBase[]
  /** 当前查看的知识库的文档列表 */
  currentKBDocuments: Document[]
  /** 知识库列表是否正在加载 */
  kbLoading: boolean
  /** 文档列表是否正在加载 */
  docsLoading: boolean
  /** 会话列表（只含摘要，消息需要加载） */
  conversations: Conversation[]
  activeConversationId: string
  messages: ChatMessage[]
  /** 会话列表是否正在加载 */
  conversationsLoading: boolean
  /** 当前会话消息是否正在加载 */
  messagesLoading: boolean
  toasts: ToastItem[]
  isTyping: boolean
  isLoggedIn: boolean
  user: User | null
  loginError: string | null
  chatMode: ChatMode
  selectedKBIds: string[]
}

// ========== Actions ==========

export type Action =
  // 视图
  | { type: "SWITCH_VIEW"; view: ViewType; kbId?: string | null }
  // 知识库
  | { type: "SET_KBS_LOADING"; loading: boolean }
  | { type: "LOAD_KBS"; items: KnowledgeBaseSummary[] }
  | { type: "ADD_KB_ITEM"; item: KnowledgeBaseSummary }
  | { type: "REMOVE_KB_ITEM"; id: string }
  // 文档
  | { type: "SET_DOCS_LOADING"; loading: boolean }
  | { type: "LOAD_DOCS"; kbId: string; docs: Document[] }
  | { type: "ADD_DOC_ITEM"; doc: Document }
  | { type: "REMOVE_DOC_ITEM"; kbId: string; docId: string }
  // 消息
  | { type: "ADD_MESSAGE"; message: ChatMessage }
  | { type: "SET_LAST_MESSAGE_TEXT"; text: string }
  | { type: "APPEND_TO_LAST_MESSAGE"; text: string }
  | { type: "SET_MESSAGE_TEXT"; id: string; text: string; conversationId?: string }
  | { type: "APPEND_TO_MESSAGE"; id: string; text: string; conversationId?: string }
  | { type: "APPEND_REASONING"; id: string; text: string; conversationId?: string }
  | { type: "SET_TYPING"; value: boolean }
  // 会话
  | { type: "LOAD_CONVERSATIONS"; summaries: ConversationSummary[] }
  | { type: "SET_CONVERSATIONS_LOADING"; loading: boolean }
  | { type: "SET_MESSAGES_LOADING"; loading: boolean }
  | { type: "SET_MESSAGES"; conversationId: string; messages: ChatMessage[] }
  | { type: "ADD_REMOTE_CONVERSATION"; summary: ConversationSummary }
  | { type: "REMOVE_CONVERSATION"; id: string }
  | { type: "UPDATE_CONVERSATION_TITLE"; id: string; title: string }
  // 认证
  | { type: "LOGIN"; user: User }
  | { type: "SET_LOGIN_ERROR"; error: string }
  | { type: "LOGOUT" }
  // 聊天模式
  | { type: "SET_CHAT_MODE"; mode: ChatMode }
  | { type: "TOGGLE_KB_SELECTION"; kbId: string }
  // 提示
  | { type: "ADD_TOAST"; toast: ToastItem }
  | { type: "REMOVE_TOAST"; id: string }

// ========== 辅助：将后端 KB 摘要转为前端 KnowledgeBase ==========

function toKnowledgeBase(s: KnowledgeBaseSummary): KnowledgeBase {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    docCount: s.doc_count,
    createdAt: s.created_at || "",
    updatedAt: s.updated_at || "",
  }
}

// ========== 初始状态 ==========

/** 从 URL search params 恢复 view（支持刷新保持当前页面） */
function _getViewFromURL(): ViewType {
  const p = new URLSearchParams(window.location.search)
  const v = p.get("view")
  if (v === "kb-list" || v === "kb-detail") return v
  return "chat"
}

const savedUser = loadAuth()

const initialState: AppState = {
  view: _getViewFromURL(),
  currentKBId: null,
  knowledgeBases: [],
  currentKBDocuments: [],
  kbLoading: false,
  docsLoading: false,
  conversations: [],
  activeConversationId: "",
  messages: [],
  conversationsLoading: false,
  messagesLoading: false,
  toasts: [],
  isTyping: false,
  isLoggedIn: !!savedUser,
  user: savedUser,
  loginError: null,
  chatMode: "normal",
  selectedKBIds: [],
}

// ========== Reducer ==========

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    // ---------- 视图 ----------
    case "SWITCH_VIEW": {
      // 同步到 URL，刷新后保持当前页面
      const url = new URL(window.location.href)
      url.searchParams.set("view", action.view)
      if (action.kbId) url.searchParams.set("kbId", action.kbId)
      else url.searchParams.delete("kbId")
      window.history.replaceState(null, "", url.toString())
      return { ...state, view: action.view, currentKBId: action.kbId ?? null }
    }

    // ---------- 知识库 ----------
    case "SET_KBS_LOADING":
      return { ...state, kbLoading: action.loading }

    case "LOAD_KBS": {
      const kbs = action.items.map(toKnowledgeBase)
      return { ...state, knowledgeBases: kbs, kbLoading: false }
    }

    case "ADD_KB_ITEM": {
      const kb = toKnowledgeBase(action.item)
      return { ...state, knowledgeBases: [kb, ...state.knowledgeBases] }
    }

    case "REMOVE_KB_ITEM": {
      return {
        ...state,
        knowledgeBases: state.knowledgeBases.filter((k) => k.id !== action.id),
        selectedKBIds: state.selectedKBIds.filter((id) => id !== action.id),
      }
    }

    // ---------- 文档 ----------
    case "SET_DOCS_LOADING":
      return { ...state, docsLoading: action.loading }

    case "LOAD_DOCS": {
      return {
        ...state,
        currentKBDocuments: action.docs,
        docsLoading: false,
        // 同步更新 knowledgeBases 中的 docCount
        knowledgeBases: state.knowledgeBases.map((kb) =>
          kb.id === action.kbId ? { ...kb, docCount: action.docs.length } : kb,
        ),
      }
    }

    case "ADD_DOC_ITEM": {
      return {
        ...state,
        currentKBDocuments: [action.doc, ...state.currentKBDocuments],
        knowledgeBases: state.knowledgeBases.map((kb) =>
          kb.id === action.doc.kb_id ? { ...kb, docCount: kb.docCount + 1 } : kb,
        ),
      }
    }

    case "REMOVE_DOC_ITEM": {
      return {
        ...state,
        currentKBDocuments: state.currentKBDocuments.filter((d) => d.id !== action.docId),
        knowledgeBases: state.knowledgeBases.map((kb) =>
          kb.id === action.kbId ? { ...kb, docCount: Math.max(0, kb.docCount - 1) } : kb,
        ),
      }
    }

    // ---------- 消息 ----------
    case "ADD_MESSAGE": {
      const newMessages = [...state.messages, action.message]
      const title =
        state.messages.length === 0
          ? action.message.text.slice(0, 20) + (action.message.text.length > 20 ? "…" : "")
          : undefined
      return {
        ...state,
        messages: newMessages,
        conversations: state.conversations.map((c) =>
          c.id === state.activeConversationId
            ? { ...c, messages: newMessages, title: title ?? c.title, updatedAt: new Date().toISOString() }
            : c,
        ),
      }
    }

    case "SET_LAST_MESSAGE_TEXT": {
      if (state.messages.length === 0) return state
      const updated = [...state.messages]
      updated[updated.length - 1] = { ...updated[updated.length - 1], text: action.text }
      return {
        ...state,
        messages: updated,
        conversations: state.conversations.map((c) =>
          c.id === state.activeConversationId
            ? { ...c, messages: updated, updatedAt: new Date().toISOString() }
            : c,
        ),
      }
    }

    case "APPEND_TO_LAST_MESSAGE": {
      if (state.messages.length === 0) return state
      const updated = [...state.messages]
      const last = { ...updated[updated.length - 1], text: updated[updated.length - 1].text + action.text }
      updated[updated.length - 1] = last
      return {
        ...state,
        messages: updated,
        conversations: state.conversations.map((c) =>
          c.id === state.activeConversationId
            ? { ...c, messages: updated, updatedAt: new Date().toISOString() }
            : c,
        ),
      }
    }

    case "SET_MESSAGE_TEXT": {
      const targetConvId = action.conversationId ?? state.activeConversationId
      if (targetConvId !== state.activeConversationId) {
        return {
          ...state,
          conversations: state.conversations.map((c) => {
            if (c.id !== targetConvId) return c
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === action.id ? { ...m, text: action.text } : m,
              ),
              updatedAt: new Date().toISOString(),
            }
          }),
        }
      }
      const idx = state.messages.findIndex((m) => m.id === action.id)
      if (idx === -1) return state
      const updated = [...state.messages]
      updated[idx] = { ...updated[idx], text: action.text }
      return {
        ...state,
        messages: updated,
        conversations: state.conversations.map((c) =>
          c.id === state.activeConversationId
            ? { ...c, messages: updated, updatedAt: new Date().toISOString() }
            : c,
        ),
      }
    }

    case "APPEND_TO_MESSAGE": {
      const targetConvId = action.conversationId ?? state.activeConversationId
      if (targetConvId !== state.activeConversationId) {
        return {
          ...state,
          conversations: state.conversations.map((c) => {
            if (c.id !== targetConvId) return c
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === action.id ? { ...m, text: m.text + action.text } : m,
              ),
              updatedAt: new Date().toISOString(),
            }
          }),
        }
      }
      const idx = state.messages.findIndex((m) => m.id === action.id)
      if (idx === -1) return state
      const updated = [...state.messages]
      updated[idx] = { ...updated[idx], text: updated[idx].text + action.text }
      return {
        ...state,
        messages: updated,
        conversations: state.conversations.map((c) =>
          c.id === state.activeConversationId
            ? { ...c, messages: updated, updatedAt: new Date().toISOString() }
            : c,
        ),
      }
    }

    case "APPEND_REASONING": {
      const targetConvId = action.conversationId ?? state.activeConversationId
      if (targetConvId !== state.activeConversationId) {
        return {
          ...state,
          conversations: state.conversations.map((c) => {
            if (c.id !== targetConvId) return c
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === action.id ? { ...m, reasoning: (m.reasoning || "") + action.text } : m,
              ),
              updatedAt: new Date().toISOString(),
            }
          }),
        }
      }
      const idx = state.messages.findIndex((m) => m.id === action.id)
      if (idx === -1) return state
      const updated = [...state.messages]
      updated[idx] = { ...updated[idx], reasoning: (updated[idx].reasoning || "") + action.text }
      return {
        ...state,
        messages: updated,
        conversations: state.conversations.map((c) =>
          c.id === state.activeConversationId
            ? { ...c, messages: updated, updatedAt: new Date().toISOString() }
            : c,
        ),
      }
    }

    case "SET_TYPING":
      return { ...state, isTyping: action.value }

    // ---------- 会话（后端驱动）----------
    case "LOAD_CONVERSATIONS": {
      const convs: Conversation[] = action.summaries.map((s) => ({
        id: s.id,
        title: s.title,
        messages: [],
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        messageCount: s.message_count,
        messagesLoaded: false,
      }))
      const activeExists = convs.some((c) => c.id === state.activeConversationId)
      const activeConvId = activeExists ? state.activeConversationId : (convs[0]?.id ?? "")
      const messages = activeExists ? state.messages : []
      return {
        ...state,
        conversations: convs,
        activeConversationId: activeConvId,
        messages,
        conversationsLoading: false,
      }
    }

    case "SET_CONVERSATIONS_LOADING":
      return { ...state, conversationsLoading: action.loading }

    case "SET_MESSAGES_LOADING":
      return { ...state, messagesLoading: action.loading }

    case "SET_MESSAGES": {
      return {
        ...state,
        activeConversationId: action.conversationId,
        messages: action.messages,
        messagesLoading: false,
        conversations: state.conversations.map((c) =>
          c.id === action.conversationId
            ? { ...c, messages: action.messages, messagesLoaded: true }
            : c,
        ),
      }
    }

    case "ADD_REMOTE_CONVERSATION": {
      const newConv: Conversation = {
        id: action.summary.id,
        title: action.summary.title,
        messages: [],
        createdAt: action.summary.created_at,
        updatedAt: action.summary.updated_at,
        messageCount: 0,
        messagesLoaded: true,
      }
      return {
        ...state,
        conversations: [newConv, ...state.conversations],
        activeConversationId: newConv.id,
        messages: [],
        isTyping: false,
      }
    }

    case "REMOVE_CONVERSATION": {
      const filtered = state.conversations.filter((c) => c.id !== action.id)
      if (filtered.length === 0) return state
      if (action.id === state.activeConversationId) {
        return {
          ...state,
          conversations: filtered,
          activeConversationId: filtered[0].id,
          messages: filtered[0].messages,
          isTyping: false,
        }
      }
      return { ...state, conversations: filtered }
    }

    case "UPDATE_CONVERSATION_TITLE":
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.id ? { ...c, title: action.title, updatedAt: new Date().toISOString() } : c,
        ),
      }

    // ---------- 认证 ----------
    case "LOGIN":
      saveAuth(action.user)
      // 登录时清掉 URL 参数 + 重置 view，确保进入对话页
      window.history.replaceState(null, "", window.location.pathname)
      return { ...state, view: "chat", isLoggedIn: true, user: action.user, loginError: null }

    case "SET_LOGIN_ERROR":
      return { ...state, loginError: action.error }

    case "LOGOUT":
      saveAuth(null)
      return { ...initialState, isLoggedIn: false, user: null }

    // ---------- 聊天模式 ----------
    case "SET_CHAT_MODE":
      return {
        ...state,
        chatMode: action.mode,
        selectedKBIds:
          action.mode === "enhanced" && state.selectedKBIds.length === 0
            ? state.knowledgeBases.filter((kb) => kb.docCount > 0).map((kb) => kb.id)
            : state.selectedKBIds,
      }

    case "TOGGLE_KB_SELECTION": {
      const exists = state.selectedKBIds.includes(action.kbId)
      const newIds = exists
        ? state.selectedKBIds.filter((id) => id !== action.kbId)
        : [...state.selectedKBIds, action.kbId]
      // 增强模式下至少保留一个知识库，不允许全部取消勾选
      if (newIds.length === 0) {
        return state
      }
      return { ...state, selectedKBIds: newIds }
    }

    // ---------- 提示 ----------
    case "ADD_TOAST":
      return { ...state, toasts: [...state.toasts, action.toast] }

    case "REMOVE_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }

    default:
      return state
  }
}

// ========== Hook ==========

export function useAppState(): {
  state: AppState
  dispatch: Dispatch<Action>
} {
  const [state, dispatch] = useReducer(reducer, initialState)

  // 登录后首次加载：会话列表 + 知识库列表
  useEffect(() => {
    if (state.isLoggedIn && state.conversations.length === 0 && !state.conversationsLoading) {
      // 加载会话
      dispatch({ type: "SET_CONVERSATIONS_LOADING", loading: true })
      fetchConversations()
        .then((summaries) => {
          dispatch({ type: "LOAD_CONVERSATIONS", summaries })
          if (summaries.length > 0) {
            loadMessagesForConversation(summaries[0].id, dispatch)
          } else {
            apiCreateConversation("新对话")
              .then((summary) => {
                dispatch({ type: "ADD_REMOTE_CONVERSATION", summary })
              })
              .catch(() => {
                const localSummary: ConversationSummary = {
                  id: genId(),
                  title: "新对话",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  message_count: 0,
                }
                dispatch({ type: "ADD_REMOTE_CONVERSATION", summary: localSummary })
              })
          }
        })
        .catch((err) => {
          dispatch({ type: "SET_CONVERSATIONS_LOADING", loading: false })
          const msg = err instanceof Error ? err.message : ""
          if (msg.includes("401") || msg.includes("403")) {
            dispatch({ type: "LOGOUT" })
          }
        })

      // 加载知识库
      dispatch({ type: "SET_KBS_LOADING", loading: true })
      fetchKnowledgeBases()
        .then((items) => dispatch({ type: "LOAD_KBS", items }))
        .catch(() => dispatch({ type: "SET_KBS_LOADING", loading: false }))
    }
  }, [state.isLoggedIn, state.conversations.length, state.conversationsLoading])

  return { state, dispatch: useCallback(dispatch, []) }
}

/** 获取当前模式的知识库标签 */
export function getKBLabel(state: AppState): { dot: boolean; text: string } {
  if (state.chatMode === "enhanced") {
    const count = state.selectedKBIds.length
    const totalDocs = state.knowledgeBases
      .filter((kb) => state.selectedKBIds.includes(kb.id))
      .reduce((s, kb) => s + kb.docCount, 0)
    return {
      dot: true,
      text: `${count} 个知识库 · ${totalDocs} 篇文档 · 增强模式`,
    }
  }
  return { dot: false, text: "通用模式" }
}

// ========== 辅助：从后端加载消息（由组件调用）==========

export async function loadMessagesForConversation(
  conversationId: string,
  dispatch: Dispatch<Action>,
): Promise<void> {
  dispatch({ type: "SET_MESSAGES_LOADING", loading: true })
  try {
    const items = await fetchMessages(conversationId)
    const msgs = toChatMessages(items)
    dispatch({ type: "SET_MESSAGES", conversationId, messages: msgs })
  } catch {
    dispatch({ type: "SET_MESSAGES_LOADING", loading: false })
  }
}

/** 新建会话（调后端） */
export async function createNewConversation(
  dispatch: Dispatch<Action>,
): Promise<void> {
  try {
    const summary = await apiCreateConversation("新对话")
    dispatch({ type: "ADD_REMOTE_CONVERSATION", summary })
  } catch {
    const localSummary: ConversationSummary = {
      id: genId(),
      title: "新对话",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      message_count: 0,
    }
    dispatch({ type: "ADD_REMOTE_CONVERSATION", summary: localSummary })
  }
}

/** 删除会话（调后端） */
export async function removeConversation(
  conversationId: string,
  dispatch: Dispatch<Action>,
): Promise<void> {
  try {
    await apiDeleteConversation(conversationId)
  } catch {
    // 后端删除失败静默处理，前端先移除
  }
  dispatch({ type: "REMOVE_CONVERSATION", id: conversationId })
}

// ========== 知识库异步操作 ==========

/** 创建知识库 */
export async function createKnowledgeBase(
  name: string,
  description: string,
  dispatch: Dispatch<Action>,
): Promise<void> {
  try {
    const item = await apiCreateKB(name, description)
    dispatch({ type: "ADD_KB_ITEM", item })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "创建失败"
    dispatch({
      type: "ADD_TOAST",
      toast: { id: Date.now().toString(), message: msg, type: "error" },
    })
    throw err
  }
}

/** 删除知识库 */
export async function deleteKnowledgeBase(
  kbId: string,
  dispatch: Dispatch<Action>,
): Promise<void> {
  try {
    await apiDeleteKB(kbId)
    dispatch({ type: "REMOVE_KB_ITEM", id: kbId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "删除失败"
    dispatch({
      type: "ADD_TOAST",
      toast: { id: Date.now().toString(), message: msg, type: "error" },
    })
    throw err
  }
}

/** 加载知识库下的文档列表 */
export async function loadDocumentsForKB(
  kbId: string,
  dispatch: Dispatch<Action>,
): Promise<void> {
  dispatch({ type: "SET_DOCS_LOADING", loading: true })
  try {
    const docs = await fetchDocuments(kbId)
    dispatch({ type: "LOAD_DOCS", kbId, docs })
  } catch {
    dispatch({ type: "SET_DOCS_LOADING", loading: false })
  }
}

/** 上传文档到知识库 */
export async function uploadDocumentToKB(
  kbId: string,
  file: File,
  dispatch: Dispatch<Action>,
): Promise<Document | null> {
  try {
    const doc = await apiUploadDocument(kbId, file)
    dispatch({ type: "ADD_DOC_ITEM", doc })
    return doc
  } catch (err) {
    const msg = err instanceof Error ? err.message : "上传失败"
    dispatch({
      type: "ADD_TOAST",
      toast: { id: Date.now().toString(), message: `「${file.name}」${msg}`, type: "error" },
    })
    return null
  }
}

/** 删除文档 */
export async function deleteDocumentFromKB(
  docId: string,
  kbId: string,
  dispatch: Dispatch<Action>,
): Promise<void> {
  try {
    await apiDeleteDocument(docId)
    dispatch({ type: "REMOVE_DOC_ITEM", kbId, docId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "删除失败"
    dispatch({
      type: "ADD_TOAST",
      toast: { id: Date.now().toString(), message: msg, type: "error" },
    })
    throw err
  }
}
