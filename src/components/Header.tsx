import { useApp } from "@/components/AppContext"
import { cn } from "@/lib/utils"

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { state, dispatch } = useApp()
  const isInManage = state.view !== "chat"

  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-5 flex-shrink-0 bg-white border-b border-thread z-[100]">
      <div className="flex items-center gap-2 md:gap-2.5">
        {/* 汉堡菜单 - 仅手机端 */}
        <button
          onClick={onMenuClick}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-ink-soft hover:bg-parchment hover:text-ink transition-colors flex-shrink-0 -ml-1"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <img
          src="/icon-purple.svg"
          alt="锦灵智拌助手"
          className="w-7 h-7 flex-shrink-0"
        />
        <span className="font-display text-[17px] font-black text-ink tracking-[0.02em]">
          锦灵智拌助手
        </span>
        <span className="font-body text-xs text-ink-muted ml-1.5 hidden sm:inline">
          餐饮AI知识伙伴
        </span>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2">
        {/* 当前用户 - 手机端隐藏 */}
        {state.user && (
          <span className="hidden sm:inline text-[12px] font-medium text-ink-muted bg-parchment px-3 py-1 rounded-full border border-thread-light">
            {state.user.username}
          </span>
        )}

        {/* 新会话按钮 - 手机端只显示图标 */}
        {!isInManage && (
          <button
            onClick={() => dispatch({ type: "NEW_CONVERSATION" })}
            className="inline-flex items-center gap-1.5 px-2 md:px-3.5 py-1.5 text-[12px] font-semibold rounded-md border border-thread text-ink-soft hover:text-persimmon hover:border-persimmon hover:bg-persimmon/5 transition-all duration-200"
            title="新会话"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">新会话</span>
          </button>
        )}

        {/* 管理端切换 */}
        <button
          onClick={() =>
            dispatch({ type: "SWITCH_VIEW", view: isInManage ? "chat" : "kb-list" })
          }
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 md:px-4 py-1.5 text-[12px] md:text-[13px] font-semibold rounded-md border transition-colors duration-200 whitespace-nowrap",
            isInManage
              ? "bg-persimmon text-white border-persimmon"
              : "text-ink-soft border-transparent hover:bg-parchment hover:text-ink"
          )}
        >
          {isInManage ? (
            <span className="hidden sm:inline">← 返回对话</span>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-ink-muted flex-shrink-0" />
              <span className="hidden sm:inline">智能体管理端</span>
            </>
          )}
          {isInManage ? (
            <span className="sm:hidden">←</span>
          ) : (
            <span className="sm:hidden text-[11px]">管理</span>
          )}
        </button>

        {/* 退出登录 */}
        <button
          onClick={() => dispatch({ type: "LOGOUT" })}
          className="inline-flex items-center gap-1 px-2 md:px-3 py-1.5 text-[12px] font-medium text-ink-muted hover:text-red-500 hover:bg-red-50 rounded-md transition-colors duration-200"
          title="退出登录"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="hidden sm:inline">退出</span>
        </button>
      </div>
    </header>
  )
}
