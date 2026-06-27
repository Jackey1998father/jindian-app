import { useRef, useCallback, useState, useEffect, type KeyboardEvent } from "react"
import { useApp } from "@/components/AppContext"
import { genId } from "@/services/storage"
import { generateAIResponse } from "@/services/rag"
import { chatStream } from "@/services/api"
import type { ChatMessage } from "@/types"

let _pendingQuery: string | null = null

export function requestSend(query: string) {
  _pendingQuery = query
}

export function ChatInput() {
  const { state, dispatch } = useApp()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const kbPopRef = useRef<HTMLDivElement>(null)
  const [kbOpen, setKbOpen] = useState(false)
  const isStreaming = useRef(false)
  const isEnhanced = state.chatMode === "enhanced"

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
    ? state.knowledgeBases.filter(kb => state.selectedKBIds.includes(kb.id) && kb.documents.length > 0)
    : []

  const doSend = useCallback(
    async (query: string) => {
      if (!query || state.isTyping || isStreaming.current) return

      const userMsg: ChatMessage = {
        id: genId(),
        role: "user",
        text: query,
        hasSource: false,
        sources: null,
        time: new Date().toISOString(),
      }
      dispatch({ type: "ADD_MESSAGE", message: userMsg })

      if (isEnhanced) {
        // ===== 增强模式：本地 RAG 搜索 =====
        dispatch({ type: "SET_TYPING", value: true })

        await new Promise((r) => setTimeout(r, 600 + Math.random() * 1000))

        const kbs = activeKBs
        const response = generateAIResponse(query, kbs)
        const aiMsg: ChatMessage = {
          id: genId(),
          role: "ai",
          text: response.text,
          hasSource: response.hasSource,
          sources: response.sources,
          time: new Date().toISOString(),
        }

        dispatch({ type: "SET_TYPING", value: false })
        dispatch({ type: "ADD_MESSAGE", message: aiMsg })
        setTimeout(() => textareaRef.current?.focus(), 50)
      } else {
        // ===== 普通模式：流式 API 调用 =====
        isStreaming.current = true

        // 插入一个气泡，内容是"美味即将到来"（ChatMessage 会渲染闪烁点）
        const aiMsgId = genId()
        dispatch({
          type: "ADD_MESSAGE",
          message: {
            id: aiMsgId,
            role: "ai",
            text: "美味即将到来",
            hasSource: false,
            sources: null,
            time: new Date().toISOString(),
          },
        })

        let receivedFirstChunk = false
        try {
          const contextMessages: ChatMessage[] = [
            ...state.messages,
            userMsg,
          ]

          await chatStream(contextMessages, (chunk) => {
            if (!receivedFirstChunk) {
              // 收到第一个字：把"美味即将到来"替换成真实内容
              receivedFirstChunk = true
              dispatch({ type: "SET_LAST_MESSAGE_TEXT", text: chunk })
            } else {
              dispatch({ type: "APPEND_TO_LAST_MESSAGE", text: chunk })
            }
          })
        } catch (err) {
          // 失败：把"美味即将到来"替换成错误提示
          dispatch({
            type: "SET_LAST_MESSAGE_TEXT",
            text: `⚠️ ${err instanceof Error ? err.message : "请求失败，请稍后重试"}`,
          })
        } finally {
          isStreaming.current = false
          setTimeout(() => textareaRef.current?.focus(), 50)
        }
      }
    },
    [state.isTyping, state.messages, isEnhanced, activeKBs, dispatch]
  )

  // Poll for pending queries from welcome chips
  const checkPending = useRef(false)
  if (!checkPending.current) {
    checkPending.current = true
    const poll = () => {
      if (_pendingQuery) {
        const q = _pendingQuery
        _pendingQuery = null
        void doSend(q)
      }
      requestAnimationFrame(poll)
    }
    requestAnimationFrame(poll)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (textareaRef.current?.value.trim()) {
        const q = textareaRef.current.value
        textareaRef.current.value = ""
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
    dispatch({ type: "TOGGLE_KB_SELECTION", kbId })
  }

  const sendDisabled = state.isTyping || isStreaming.current

  return (
    <div className="px-4 md:px-7 pt-2 md:pt-3 pb-3 md:pb-5 border-t border-thread bg-white flex-shrink-0">
      {/* 模式切换行 */}
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-1.5 bg-parchment rounded-lg p-0.5">
          <button
            onClick={() => handleModeSwitch("normal")}
            className={`px-2 md:px-3 py-1 text-[11px] md:text-[12px] font-semibold rounded-md transition-all duration-200 whitespace-nowrap ${
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
              className={`px-2 md:px-3 py-1 text-[11px] md:text-[12px] font-semibold rounded-md transition-all duration-200 whitespace-nowrap ${
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
                  {state.knowledgeBases.filter(kb => kb.documents.length > 0).length === 0 && (
                    <p className="text-[11px] text-ink-faint mt-0.5">
                      暂无可用知识库，请先在管理端添加文档
                    </p>
                  )}
                </div>
                <div className="overflow-y-auto py-1 custom-scroll" style={{ maxHeight: "180px" }}>
                  {state.knowledgeBases.filter(kb => kb.documents.length > 0).length === 0 ? (
                    <div className="px-3 py-4 text-center">
                      <span className="text-[12px] text-ink-faint">暂无知识库</span>
                    </div>
                  ) : (
                    state.knowledgeBases
                      .filter(kb => kb.documents.length > 0)
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
                                {kb.documents.length} 篇文档
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
      <div className="flex gap-2 md:gap-2.5 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            onKeyDown={handleKeyDown}
            placeholder={isEnhanced && activeKBs.length > 0 ? "搜索知识库中的内容…" : "输入您的问题…"}
            rows={1}
            className="w-full min-h-12 max-h-[140px] px-3 md:px-4 py-3 text-sm leading-relaxed text-ink bg-parchment rounded-[10px] border border-thread resize-none transition-all duration-200 placeholder:text-ink-faint focus:border-persimmon focus:bg-white focus:shadow-[0_0_0_3px_rgba(224,85,31,0.08),inset_0_1px_0_#F3EDE6] outline-none"
          />
        </div>

        <button
          onClick={() => {
            const el = textareaRef.current
            if (el?.value.trim()) {
              const q = el.value
              el.value = ""
              void doSend(q)
            }
          }}
          disabled={sendDisabled}
          className="w-11 h-11 md:w-12 md:h-12 rounded-[10px] bg-persimmon text-white flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:bg-ink-faint disabled:cursor-not-allowed hover:bg-persimmon-hi hover:scale-105 active:scale-95"
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
  )
}
