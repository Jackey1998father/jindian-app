import { useState } from "react"
import { useApp } from "@/components/AppContext"
import { cn } from "@/lib/utils"
import { createNewConversation, loadMessagesForConversation, removeConversation } from "@/hooks/useApp"

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "刚刚"
  if (diffMin < 60) return `${diffMin} 分钟前`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} 小时前`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay} 天前`
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const STORAGE_KEY = "sidebar-collapsed"

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen?: boolean
  onClose?: () => void
}) {
  const { state, dispatch } = useApp()
  const conversations = state.conversations
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1"
    } catch {
      return false
    }
  })

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      try {
        localStorage.setItem(STORAGE_KEY, prev ? "0" : "1")
      } catch {
        /* ignore */
      }
      return !prev
    })
  }

  const handleNewConv = async () => {
    await createNewConversation(dispatch)
    onClose?.()
  }

  const handleSwitch = async (id: string) => {
    // 如果在管理端，先切回对话页（即使点的是已激活会话也要切）
    if (state.view !== "chat") {
      dispatch({ type: "SWITCH_VIEW", view: "chat" })
    }

    if (id === state.activeConversationId) {
      onClose?.()
      return
    }

    const conv = conversations.find((c) => c.id === id)
    if (!conv) {
      onClose?.()
      return
    }

    // 加载消息（内部会 dispatch SET_MESSAGES），不额外覆盖
    if (!conv.messagesLoaded) {
      await loadMessagesForConversation(id, dispatch)
    } else {
      // 已加载过，直接切换显示
      dispatch({ type: "SET_MESSAGES", conversationId: id, messages: conv.messages })
    }
    onClose?.()
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    // 至少保留一个会话，不允许全部删除
    if (conversations.length <= 1) return
    await removeConversation(id, dispatch)
  }

  /** 侧边栏主体，isCollapsed 仅桌面端生效（手机抽屉始终展开） */
  const renderContent = (isCollapsed: boolean) => (
    <aside
      className={cn(
        "flex-shrink-0 border-r border-thread bg-[#FBF8F3] flex flex-col h-full overflow-hidden",
        "transition-[width] duration-300 ease-in-out",
        isCollapsed ? "w-0 border-r-0" : "w-[260px]"
      )}
    >
      {/* 内容固定 260px 宽，收起时只被裁剪，不重新排版 */}
      <div className="w-[260px] flex flex-col h-full">
      {/* 新会话按钮 */}
      <div className="px-4 pt-4 pb-3">
        <button
          onClick={handleNewConv}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-white bg-persimmon rounded-lg transition-all duration-200 hover:bg-persimmon-hi hover:shadow-[0_2px_8px_rgba(224,85,31,0.25)] active:scale-[0.98]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          新会话
        </button>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto custom-scroll px-3 pb-3">
        {conversations.length === 0 ? (
          <p className="text-center text-xs text-ink-muted mt-8 px-2">
            暂无历史会话
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSwitch(conv.id)}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 active:scale-[0.98]",
                  conv.id === state.activeConversationId
                    ? "bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-thread-light"
                    : "hover:bg-white/70 border border-transparent"
                )}
              >
                {/* 会话图标 */}
                <div
                  className={cn(
                    "w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0",
                    conv.id === state.activeConversationId
                      ? "bg-persimmon/10 text-persimmon"
                      : "bg-ink-faint/20 text-ink-muted"
                  )}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>

                {/* 标题和时间 */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-[13px] font-medium truncate",
                      conv.id === state.activeConversationId ? "text-ink" : "text-ink-soft"
                    )}
                  >
                    {conv.title}
                  </p>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    {formatTime(conv.updatedAt || conv.createdAt)}
                    {(conv.messageCount ?? 0) > 0 && (
                      <span className="ml-1.5">· {conv.messageCount} 条消息</span>
                    )}
                  </p>
                </div>

                {/* 删除按钮：只有多于 1 个会话时才显示 */}
                {conversations.length > 1 && (
                  <button
                    onClick={(e) => handleDelete(e, conv.id)}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md text-ink-muted hover:text-red-500 hover:bg-red-50 transition-all duration-150 flex-shrink-0"
                    title="删除会话"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </aside>
  )

  return (
    <>
      {/* 桌面端：可收起/展开 */}
      <div className="hidden md:flex h-full relative group/sidebar">
        {renderContent(collapsed)}

        {/* 中间伸缩把手 */}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? "展开侧边栏" : "收起侧边栏"}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 z-10 flex items-center justify-center",
            "w-5 h-12 bg-white border border-thread rounded-full shadow-[0_2px_8px_rgba(45,39,32,0.1)] text-ink-muted",
            "hover:text-persimmon hover:border-persimmon hover:shadow-[0_4px_12px_rgba(224,85,31,0.18)] active:scale-90 transition-all duration-200",
            collapsed ? "left-1" : "right-[-10px]"
          )}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? (
              <polyline points="9 18 15 12 9 6" />
            ) : (
              <polyline points="15 18 9 12 15 6" />
            )}
          </svg>
        </button>
      </div>

      {/* 手机端：遮罩 + 抽屉 */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[200]">
          {/* 遮罩 */}
          <div
            className="absolute inset-0 bg-overlay-hi animate-fade-in"
            onClick={onClose}
          />
          {/* 抽屉面板 */}
          <div className="absolute left-0 top-0 bottom-0 z-10 animate-slide-in-left">
            {renderContent(false)}
          </div>
        </div>
      )}
    </>
  )
}
