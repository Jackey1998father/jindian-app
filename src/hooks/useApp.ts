import { useReducer, useCallback, useEffect, type Dispatch } from "react"
import type {
  KnowledgeBase,
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
  loadKnowledgeBases,
  saveKnowledgeBases,
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
} from "@/services/api"

// ========== State ==========

export interface AppState {
  view: ViewType
  currentKBId: string | null
  knowledgeBases: KnowledgeBase[]
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
  | { type: "ADD_KB"; name: string; description: string }
  | { type: "DELETE_KB"; id: string }
  | { type: "ADD_DOC"; kbId: string; title: string; content: string; fileName: string; fileType: DocFileType; fileSize: number }
  | { type: "DELETE_DOC"; kbId: string; docId: string }
  // 消息
  | { type: "ADD_MESSAGE"; message: ChatMessage }
  | { type: "SET_LAST_MESSAGE_TEXT"; text: string }
  | { type: "APPEND_TO_LAST_MESSAGE"; text: string }
  | { type: "SET_MESSAGE_TEXT"; id: string; text: string; conversationId?: string }
  | { type: "APPEND_TO_MESSAGE"; id: string; text: string; conversationId?: string }
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

// ========== 初始状态 ==========

const savedUser = loadAuth()
const savedKBs = loadKnowledgeBases()

const initialState: AppState = {
  view: "chat",
  currentKBId: null,
  knowledgeBases: savedKBs,
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
    case "SWITCH_VIEW":
      return { ...state, view: action.view, currentKBId: action.kbId ?? null }

    // ---------- 知识库 ----------
    case "ADD_KB": {
      const kb: KnowledgeBase = {
        id: genId(),
        name: action.name,
        description: action.description,
        documents: [],
        createdAt: new Date().toISOString(),
      }
      const next = { ...state, knowledgeBases: [...state.knowledgeBases, kb] }
      saveKnowledgeBases(next.knowledgeBases)
      return next
    }

    case "DELETE_KB": {
      const next = { ...state, knowledgeBases: state.knowledgeBases.filter((k) => k.id !== action.id) }
      saveKnowledgeBases(next.knowledgeBases)
      return next
    }

    case "ADD_DOC": {
      const doc: Document = {
        id: genId(),
        title: action.title,
        content: action.content,
        fileName: action.fileName,
        fileType: action.fileType,
        fileSize: action.fileSize,
        createdAt: new Date().toISOString(),
      }
      const next = {
        ...state,
        knowledgeBases: state.knowledgeBases.map((kb) =>
          kb.id === action.kbId ? { ...kb, documents: [...kb.documents, doc] } : kb,
        ),
      }
      saveKnowledgeBases(next.knowledgeBases)
      return next
    }

    case "DELETE_DOC": {
      const next = {
        ...state,
        knowledgeBases: state.knowledgeBases.map((kb) =>
          kb.id === action.kbId
            ? { ...kb, documents: kb.documents.filter((d) => d.id !== action.docId) }
            : kb,
        ),
      }
      saveKnowledgeBases(next.knowledgeBases)
      return next
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
      // 非活跃会话：只更新 conversations 缓存，不碰 state.messages
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
      // 活跃会话：同时更新 state.messages 和 conversations 缓存
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
      // 非活跃会话：只更新 conversations 缓存
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
      // 活跃会话：同时更新 state.messages 和 conversations 缓存
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
      // 保持当前活跃会话和消息
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
        messagesLoaded: true, // 新会话没有消息，视为已加载
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
      // 至少保留一个会话，不允许全部删除
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
      return { ...state, isLoggedIn: true, user: action.user, loginError: null }

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
            ? state.knowledgeBases.filter((kb) => kb.documents.length > 0).map((kb) => kb.id)
            : state.selectedKBIds,
      }

    case "TOGGLE_KB_SELECTION": {
      const exists = state.selectedKBIds.includes(action.kbId)
      const newIds = exists
        ? state.selectedKBIds.filter((id) => id !== action.kbId)
        : [...state.selectedKBIds, action.kbId]
      if (newIds.length === 0) {
        return { ...state, selectedKBIds: newIds, chatMode: "normal" }
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

export interface AsyncDispatch {
  /** 登录后加载会话列表 */
  loadConversationsOnLogin: () => Promise<void>
  /** 新建会话（调后端 API） */
  newConversation: () => void
  /** 切换会话（加载消息） */
  switchConversation: (id: string) => void
  /** 删除会话（调后端 API） */
  deleteConversation: (id: string) => void
}

export function useAppState(): {
  state: AppState
  dispatch: Dispatch<Action>
} {
  const [state, dispatch] = useReducer(reducer, initialState)

  // 登录后首次加载会话列表
  useEffect(() => {
    if (state.isLoggedIn && state.conversations.length === 0 && !state.conversationsLoading) {
      dispatch({ type: "SET_CONVERSATIONS_LOADING", loading: true })
      fetchConversations()
        .then((summaries) => {
          dispatch({ type: "LOAD_CONVERSATIONS", summaries })
          // 自动加载第一条会话的消息
          if (summaries.length > 0) {
            loadMessagesForConversation(summaries[0].id, dispatch)
          } else {
            // 新用户没有会话：自动创建一个默认会话
            apiCreateConversation("新对话")
              .then((summary) => {
                dispatch({ type: "ADD_REMOTE_CONVERSATION", summary })
              })
              .catch(() => {
                // 后端创建失败则本地降级
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
          // 401/403 表示 token 过期或无效，强制退出到登录页
          const msg = err instanceof Error ? err.message : ""
          if (msg.includes("401") || msg.includes("403")) {
            dispatch({ type: "LOGOUT" })
          }
        })
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
      .reduce((s, kb) => s + kb.documents.length, 0)
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
    // 后端调用失败则本地降级
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
