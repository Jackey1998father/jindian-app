import { useReducer, useCallback, type Dispatch } from "react"
import type { KnowledgeBase, Document, ChatMessage, Conversation, ViewType, ToastItem, DocFileType, User, ChatMode } from "@/types"
import { loadData, saveData, genId, saveAuth, loadAuth } from "@/services/storage"

export interface AppState {
  view: ViewType
  currentKBId: string | null
  knowledgeBases: KnowledgeBase[]
  conversations: Conversation[]
  activeConversationId: string
  messages: ChatMessage[]
  toasts: ToastItem[]
  isTyping: boolean
  isLoggedIn: boolean
  user: User | null
  loginError: string | null
  chatMode: ChatMode
  selectedKBIds: string[]
}

export type Action =
  | { type: "SWITCH_VIEW"; view: ViewType; kbId?: string | null }
  | { type: "ADD_KB"; name: string; description: string }
  | { type: "DELETE_KB"; id: string }
  | { type: "ADD_DOC"; kbId: string; title: string; content: string; fileName: string; fileType: DocFileType; fileSize: number }
  | { type: "DELETE_DOC"; kbId: string; docId: string }
  | { type: "ADD_MESSAGE"; message: ChatMessage }
  | { type: "SET_LAST_MESSAGE_TEXT"; text: string }
  | { type: "APPEND_TO_LAST_MESSAGE"; text: string }
  | { type: "SET_TYPING"; value: boolean }
  | { type: "ADD_TOAST"; toast: ToastItem }
  | { type: "REMOVE_TOAST"; id: string }
  | { type: "LOGIN"; username: string; password: string }
  | { type: "LOGOUT" }
  | { type: "SET_CHAT_MODE"; mode: ChatMode }
  | { type: "TOGGLE_KB_SELECTION"; kbId: string }
  | { type: "NEW_CONVERSATION" }
  | { type: "SWITCH_CONVERSATION"; id: string }
  | { type: "DELETE_CONVERSATION"; id: string }

const stored = loadData()

// 选择初始化时的活跃对话：有历史 → 用最近一个；没有 → 新建
const hasHistory = stored.conversations.length > 0
const initConv = hasHistory
  ? stored.conversations[0] // conversations 按时间倒序，最近的在最前
  : {
      id: genId(),
      title: "新对话",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
const defaultConvId = initConv.id
const defaultMessages = hasHistory ? initConv.messages : []

function syncActiveConversation(state: AppState): Conversation[] {
  return state.conversations.map((c) =>
    c.id === state.activeConversationId
      ? { ...c, messages: state.messages, updatedAt: new Date().toISOString() }
      : c
  )
}

function autoTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user")
  if (firstUser) {
    return firstUser.text.slice(0, 20) + (firstUser.text.length > 20 ? "…" : "")
  }
  return "新对话"
}

function persistence(state: AppState): AppState {
  const convs = syncActiveConversation(state)
  saveData({ knowledgeBases: state.knowledgeBases, conversations: convs })
  return { ...state, conversations: convs }
}

function reducer(state: AppState, action: Action): AppState {
  let next: AppState
  switch (action.type) {
    case "SWITCH_VIEW":
      return { ...state, view: action.view, currentKBId: action.kbId ?? null }

    case "ADD_KB": {
      const kb: KnowledgeBase = {
        id: genId(),
        name: action.name,
        description: action.description,
        documents: [],
        createdAt: new Date().toISOString(),
      }
      next = { ...state, knowledgeBases: [...state.knowledgeBases, kb] }
      break
    }

    case "DELETE_KB":
      next = { ...state, knowledgeBases: state.knowledgeBases.filter((k) => k.id !== action.id) }
      break

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
      next = {
        ...state,
        knowledgeBases: state.knowledgeBases.map((kb) =>
          kb.id === action.kbId ? { ...kb, documents: [...kb.documents, doc] } : kb
        ),
      }
      break
    }

    case "DELETE_DOC":
      next = {
        ...state,
        knowledgeBases: state.knowledgeBases.map((kb) =>
          kb.id === action.kbId ? { ...kb, documents: kb.documents.filter((d) => d.id !== action.docId) } : kb
        ),
      }
      break

    case "ADD_MESSAGE": {
      const newMessages = [...state.messages, action.message]
      const title = state.messages.length === 0 ? autoTitle(newMessages) : undefined
      next = {
        ...state,
        messages: newMessages,
        conversations: state.conversations.map((c) =>
          c.id === state.activeConversationId
            ? { ...c, messages: newMessages, title: title ?? c.title, updatedAt: new Date().toISOString() }
            : c
        ),
      }
      break
    }

    case "SET_LAST_MESSAGE_TEXT": {
      if (state.messages.length === 0) return state
      const updated = [...state.messages]
      updated[updated.length - 1] = { ...updated[updated.length - 1], text: action.text }
      next = {
        ...state,
        messages: updated,
        conversations: state.conversations.map((c) =>
          c.id === state.activeConversationId
            ? { ...c, messages: updated, updatedAt: new Date().toISOString() }
            : c
        ),
      }
      break
    }

    case "APPEND_TO_LAST_MESSAGE": {
      if (state.messages.length === 0) return state
      const updated = [...state.messages]
      const last = { ...updated[updated.length - 1], text: updated[updated.length - 1].text + action.text }
      updated[updated.length - 1] = last
      next = {
        ...state,
        messages: updated,
        conversations: state.conversations.map((c) =>
          c.id === state.activeConversationId
            ? { ...c, messages: updated, updatedAt: new Date().toISOString() }
            : c
        ),
      }
      break
    }

    case "SET_TYPING":
      return { ...state, isTyping: action.value }

    case "ADD_TOAST":
      next = { ...state, toasts: [...state.toasts, action.toast] }
      break

    case "REMOVE_TOAST":
      next = { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }
      break

    case "LOGIN": {
      const user = action.username.trim()
      const pass = action.password.trim()
      if (!user) {
        return { ...state, loginError: "请输入账号" }
      }
      if (!pass) {
        return { ...state, loginError: "请输入密码" }
      }
      const loggedInUser = { username: user }
      saveAuth(loggedInUser)
      return { ...state, isLoggedIn: true, user: loggedInUser, loginError: null }
    }

    case "LOGOUT":
      saveAuth(null)
      return { ...initialState }

    case "SET_CHAT_MODE":
      return {
        ...state,
        chatMode: action.mode,
        selectedKBIds: action.mode === "enhanced" && state.selectedKBIds.length === 0
          ? state.knowledgeBases.filter(kb => kb.documents.length > 0).map(kb => kb.id)
          : state.selectedKBIds,
      }

    case "TOGGLE_KB_SELECTION": {
      const exists = state.selectedKBIds.includes(action.kbId)
      const newIds = exists
        ? state.selectedKBIds.filter(id => id !== action.kbId)
        : [...state.selectedKBIds, action.kbId]
      // 如果取消全选，自动切回普通模式
      if (newIds.length === 0) {
        return { ...state, selectedKBIds: newIds, chatMode: "normal" }
      }
      return { ...state, selectedKBIds: newIds }
    }

    case "NEW_CONVERSATION": {
      const synced = syncActiveConversation(state)
      const keepConvs = synced.filter((c) => c.messages.length > 0)
      const newConv: Conversation = {
        id: genId(),
        title: "新对话",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      next = {
        ...state,
        conversations: [newConv, ...keepConvs],
        activeConversationId: newConv.id,
        messages: [],
        isTyping: false,
      }
      break
    }

    case "SWITCH_CONVERSATION": {
      const conv = state.conversations.find((c) => c.id === action.id)
      if (!conv) return state
      next = {
        ...state,
        // 先同步当前会话的消息回 conversations
        conversations: syncActiveConversation(state),
        activeConversationId: action.id,
        messages: conv.messages,
        isTyping: false,
      }
      break
    }

    case "DELETE_CONVERSATION": {
      const filtered = state.conversations.filter((c) => c.id !== action.id)
      if (action.id === state.activeConversationId) {
        // 删的是当前会话 → 打开最新会话或新建
        if (filtered.length > 0) {
          const latest = filtered[0]
          next = { ...state, conversations: filtered, activeConversationId: latest.id, messages: latest.messages, isTyping: false }
        } else {
          const newConv: Conversation = {
            id: genId(),
            title: "新对话",
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          next = { ...state, conversations: [newConv], activeConversationId: newConv.id, messages: [], isTyping: false }
        }
      } else {
        next = { ...state, conversations: filtered }
      }
      break
    }

    default:
      return state
  }

  return persistence(next)
}

const savedUser = loadAuth()

const initialState: AppState = {
  view: "chat",
  currentKBId: null,
  knowledgeBases: stored.knowledgeBases,
  conversations: hasHistory
    ? stored.conversations
    : [initConv],
  activeConversationId: defaultConvId,
  messages: defaultMessages,
  toasts: [],
  isTyping: false,
  isLoggedIn: !!savedUser,
  user: savedUser,
  loginError: null,
  chatMode: "normal",
  selectedKBIds: [],
}

export function useAppState(): {
  state: AppState
  dispatch: Dispatch<Action>
} {
  const [state, dispatch] = useReducer(reducer, initialState)
  return { state, dispatch: useCallback(dispatch, []) }
}

export function getKBLabel(state: AppState): { dot: boolean; text: string } {
  if (state.chatMode === "enhanced") {
    const count = state.selectedKBIds.length
    const totalDocs = state.knowledgeBases
      .filter(kb => state.selectedKBIds.includes(kb.id))
      .reduce((s, kb) => s + kb.documents.length, 0)
    return {
      dot: true,
      text: `${count} 个知识库 · ${totalDocs} 篇文档 · 增强模式`,
    }
  }
  return { dot: false, text: "通用模式" }
}
