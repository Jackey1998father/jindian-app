import { useRef, useCallback, useState, useEffect, type KeyboardEvent } from "react"
import { useApp } from "@/components/AppContext"
import { AlertDialog } from "@/components/AlertDialog"
import { genId } from "@/services/storage"
import { chatStream, ragChatStream, createConversation } from "@/services/api"
import type { ChatMessage, ConversationSummary } from "@/types"

let _setInputQuery: ((q: string) => void) | null = null

/** 将文字填入输入框，不自动发送（由 WelcomeScreen 快捷标签调用） */
export function requestFill(query: string) {
  _setInputQuery?.(query)
}

export function ChatInput() {
  const { state, dispatch } = useApp()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const kbPopRef = useRef<HTMLDivElement>(null)
  const [kbOpen, setKbOpen] = useState(false)
  const [streamingConvId, setStreamingConvId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [thinkingEnabled, setThinkingEnabled] = useState(false)
  const [kbAlertOpen, setKbAlertOpen] = useState(false)
  const queryRef = useRef(query)

  // 同步 ref + 注册模块级 setter，供 WelcomeScreen 快捷标签直接填入
  useEffect(() => {
    queryRef.current = query
  }, [query])
  useEffect(() => {
    _setInputQuery = (q: string) => {
      setQuery(q)
      // 延迟聚焦，等 React 渲染完
      setTimeout(() => textareaRef.current?.focus(), 0)
    }
    return () => { _setInputQuery = null }
  }, [])
  const isEnhanced = state.chatMode === "enhanced"
  const activeConvIdRef = useRef(state.activeConversationId)
  // 按会话管理流：支持多会话同时流式，同一会话重复发送则 abort 旧的
  const streamingConvIdsRef = useRef<Set<string>>(new Set())
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map())

  // 同步当前活跃会话 ID 的 ref，供流式回调读取最新值
  useEffect(() => {
    activeConvIdRef.current = state.activeConversationId
  }, [state.activeConversationId])

  // 组件卸载时取消所有正在进行的流式请求
  useEffect(() => {
    return () => {
      abortControllersRef.current.forEach((ac) => ac.abort())
    }
  }, [])

  // 点击外部关闭 KB 选择弹窗
  useEffect(() => {
    if (!kbOpen) return
    const handler = (e: MouseEvent) => {
      if (kbPopRef.current && !kbPopRef.current.contains(e.target as Node)) {
        setKbOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [kbOpen])

  const activeKBs = isEnhanced
    ? state.knowledgeBases.filter(kb => state.selectedKBIds.includes(kb.id) && kb.docCount > 0)
    : []

  const doSend = useCallback(
    async (query: string) => {
      if (!query || state.isTyping) return

      // 决定是否走 RAG 增强（需同时满足：增强模式 + 已选知识库）
      const useRag = isEnhanced && state.selectedKBIds.length > 0

      // ===== 确保有活跃会话（先建会话，再插消息，避免 ADD_REMOTE_CONVERSATION 清空消息）=====
      let convId = state.activeConversationId
      if (!convId) {
        try {
          const summary = await createConversation("新对话")
          convId = summary.id
          dispatch({ type: "ADD_REMOTE_CONVERSATION", summary })
        } catch {
          // 后端不可用时本地降级
          const fallback: ConversationSummary = {
            id: genId(),
            title: "新对话",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            message_count: 0,
          }
          convId = fallback.id
          dispatch({ type: "ADD_REMOTE_CONVERSATION", summary: fallback })
        }
      }

      const userMsg: ChatMessage = {
        id: genId(),
        role: "user",
        text: query,
        hasSource: false,
        sources: null,
        time: new Date().toISOString(),
      }
      dispatch({ type: "ADD_MESSAGE", message: userMsg })

      // ===== 同一会话内重复发送则取消上一个流，跨会话互不干扰 =====
      if (streamingConvIdsRef.current.has(convId)) {
        abortControllersRef.current.get(convId)?.abort()
      }
      streamingConvIdsRef.current.add(convId)
      setStreamingConvId(convId)
      const ac = new AbortController()
      abortControllersRef.current.set(convId, ac)

      // ===== 插入占位气泡（检索中 / 美味即将到来）=====
      const aiMsgId = genId()
      const placeholderText = useRag
        ? "🔍 正在检索知识库..."
        : thinkingEnabled
          ? "美味深度制造中"
          : "美味即将到来"
      dispatch({
        type: "ADD_MESSAGE",
        message: {
          id: aiMsgId,
          role: "ai",
          text: placeholderText,
          hasSource: false,
          sources: null,
          time: new Date().toISOString(),
        },
      })

      let receivedFirstChunk = false
      try {
        const handleChunk = (chunk: { content?: string; reasoning?: string }) => {
          // 思考过程：持续追加
          if (chunk.reasoning) {
            dispatch({ type: "APPEND_REASONING", id: aiMsgId, text: chunk.reasoning, conversationId: convId })
          }
          // 回答内容：首次替换占位，后续追加
          if (chunk.content) {
            if (!receivedFirstChunk) {
              receivedFirstChunk = true
              dispatch({ type: "SET_MESSAGE_TEXT", id: aiMsgId, text: chunk.content, conversationId: convId })
            } else {
              dispatch({ type: "APPEND_TO_MESSAGE", id: aiMsgId, text: chunk.content, conversationId: convId })
            }
          }
        }

        if (useRag) {
          // ===== 增强模式：RAG 流式 API =====
          await ragChatStream(convId, query, state.selectedKBIds, handleChunk, ac.signal, thinkingEnabled)
        } else {
          // ===== 普通模式：流式 API =====
          await chatStream(convId, query, handleChunk, ac.signal, thinkingEnabled)
        }
      } catch (err) {
        // AbortError 是正常取消，不展示错误
        if (err instanceof DOMException && err.name === "AbortError") return
        // 始终写入对应会话缓存（活跃时渲染到视图，非活跃时切回可见）
        dispatch({
          type: "SET_MESSAGE_TEXT",
          id: aiMsgId,
          text: `⚠️ ${err instanceof Error ? err.message : "请求失败，请稍后重试"}`,
          conversationId: convId,
        })
      } finally {
        // 清理该会话的流式状态
        streamingConvIdsRef.current.delete(convId)
        abortControllersRef.current.delete(convId)
        setStreamingConvId((current) => (current === convId ? null : current))
        setTimeout(() => textareaRef.current?.focus(), 50)
      }
    },
    [state.isTyping, state.activeConversationId, isEnhanced, state.selectedKBIds, thinkingEnabled, dispatch]
  )

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const q = query.trim()
      if (q) {
        setQuery("")
        void doSend(q)
      }
    }
  }

  const handleModeSwitch = (mode: "normal" | "enhanced") => {
    dispatch({ type: "SET_CHAT_MODE", mode })
    if (mode === "enhanced") {
      setKbOpen(true)
    }
  }

  const toggleKb = (kbId: string) => {
    const checked = state.selectedKBIds.includes(kbId)
    // 增强模式下至少保留一个知识库，取消最后一个时弹窗提示
    if (checked && state.selectedKBIds.length === 1) {
      setKbAlertOpen(true)
      return
    }
    dispatch({ type: "TOGGLE_KB_SELECTION", kbId })
  }

  const sendDisabled = state.isTyping || streamingConvIdsRef.current.has(state.activeConversationId)

  return (
    <div className="px-4 md:px-7 pt-2 md:pt-3 pb-[max(12px,env(safe-area-inset-bottom))] md:pb-[max(20px,env(safe-area-inset-bottom))] flex-shrink-0">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-thread shadow-[0_2px_16px_rgba(45,39,32,0.06)] p-2.5 md:p-3">
        {/* 模式切换行 */}
        <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-1.5 bg-parchment rounded-lg p-0.5">
          <button
            onClick={() => handleModeSwitch("normal")}
            className={`px-2 md:px-3 py-1 text-[11px] md:text-[12px] font-semibold rounded-md transition-all duration-200 whitespace-nowrap active:scale-[0.96] ${
              !isEnhanced
                ? "bg-white text-ink shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            普通模式
          </button>
          <div className="relative">
            <button
              onClick={() => handleModeSwitch("enhanced")}
              className={`px-2 md:px-3 py-1 text-[11px] md:text-[12px] font-semibold rounded-md transition-all duration-200 whitespace-nowrap active:scale-[0.96] ${
                isEnhanced
                  ? "bg-sprout text-white shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              增强模式
            </button>

            {/* 向上弹出的知识库选择列表 */}
            {kbOpen && (
              <div ref={kbPopRef} className="absolute bottom-full left-0 mb-2 w-56 md:w-64 bg-white rounded-xl shadow-lg border border-thread z-50 overflow-hidden animate-fade-in">
                <div className="px-3 py-2 border-b border-thread bg-parchment">
                  <span className="text-[11px] font-semibold text-ink-muted tracking-wide">
                    选择要搜索的知识库
                  </span>
                  {state.knowledgeBases.filter(kb => kb.docCount > 0).length === 0 && (
                    <p className="text-[11px] text-ink-faint mt-0.5">
                      暂无可用知识库，请先在管理端添加文档
                    </p>
                  )}
                </div>
                <div className="overflow-y-auto py-1 custom-scroll" style={{ maxHeight: "180px" }}>
                  {state.knowledgeBases.filter(kb => kb.docCount > 0).length === 0 ? (
                    <div className="px-3 py-4 text-center">
                      <span className="text-[12px] text-ink-faint">暂无知识库</span>
                    </div>
                  ) : (
                    state.knowledgeBases
                      .filter(kb => kb.docCount > 0)
                      .map((kb) => {
                        const checked = state.selectedKBIds.includes(kb.id)
                        return (
                          <label
                            key={kb.id}
                            className="flex items-center gap-2.5 px-3 py-2 hover:bg-parchment cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleKb(kb.id)}
                              className="w-3.5 h-3.5 rounded accent-sprout cursor-pointer flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-medium text-ink truncate">
                                {kb.name}
                              </div>
                              <div className="text-[10px] text-ink-faint">
                                {kb.docCount} 篇文档
                              </div>
                            </div>
                          </label>
                        )
                      })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧状态指示 - 手机端隐藏 */}
        <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-muted tracking-[0.02em]">
          <span
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              isEnhanced && activeKBs.length > 0 ? "bg-sprout" : "bg-ink-faint"
            }`}
          />
          {isEnhanced
            ? `${activeKBs.length} 个知识库 · 增强模式`
            : "通用模式"}
        </div>
      </div>

      {/* 输入框 */}
      <div className="flex gap-2 md:gap-2.5 items-center">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isEnhanced && activeKBs.length > 0 ? "搜索知识库中的内容…" : "输入您的问题…"}
            rows={1}
            className="w-full min-h-12 max-h-[140px] px-3 md:pl-4 md:pr-20 py-3 text-sm leading-relaxed text-ink bg-parchment rounded-[10px] border border-thread resize-none transition-all duration-200 placeholder:text-ink-faint focus:border-persimmon focus:bg-white focus:shadow-[0_0_0_3px_rgba(224,85,31,0.08),inset_0_1px_0_#F3EDE6] outline-none"
          />

          {/* 思考开关 — 嵌入输入框内右侧 */}
          <button
            onClick={() => setThinkingEnabled((v) => !v)}
            title={thinkingEnabled ? "已开启深度思考" : "开启深度思考"}
            className={`absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-1.5 py-1 text-[11px] font-semibold rounded-md transition-all duration-200 whitespace-nowrap border active:scale-90 ${
              thinkingEnabled
                ? "bg-thinking-bg text-thinking border-thinking"
                : "text-ink-faint border-transparent hover:text-ink-muted hover:bg-parchment"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={thinkingEnabled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 3 3 3 3 0 0 0 3-3V5a3 3 0 0 0-3-3z" />
              <path d="M12 9v3" />
              <path d="M4.93 8.07l-.7-.7a3 3 0 0 1 4.24-4.24l.7.7" />
              <path d="M19.07 8.07l.7-.7a3 3 0 0 0-4.24-4.24l-.7.7" />
              <path d="M8 22h8" />
              <path d="M12 18v4" />
            </svg>
            <span className="hidden sm:inline">思考</span>
          </button>
        </div>

        <button
          onClick={() => {
            const q = query.trim()
            if (q) {
              setQuery("")
              void doSend(q)
            }
          }}
          disabled={sendDisabled}
          className="w-11 h-11 md:w-12 md:h-12 rounded-[10px] bg-gradient-to-br from-persimmon to-persimmon-hi text-white flex items-center justify-center flex-shrink-0 transition-all duration-200 shadow-[0_2px_8px_rgba(224,85,31,0.28)] disabled:from-ink-faint disabled:to-ink-faint disabled:shadow-none disabled:cursor-not-allowed hover:shadow-[0_4px_14px_rgba(224,85,31,0.35)] hover:scale-105 active:scale-95 mb-[3px]"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
      </div>

      <AlertDialog
        open={kbAlertOpen}
        title="至少保留一个知识库"
        message="增强模式下必须至少选择一个知识库，无法全部取消勾选。"
        onConfirm={() => setKbAlertOpen(false)}
      />
    </div>
  )
}
