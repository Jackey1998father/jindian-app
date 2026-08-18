import type { ChatMessage as ChatMessageType } from "@/types"
import { MarkdownRenderer } from "@/components/MarkdownRenderer"
import { cn } from "@/lib/utils"

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user"
  const avatarSrc = isUser ? "/avatars/user-avatar.png" : "/icon-purple.svg"
  const isWaiting = !isUser && (message.text === "美味即将到来" || message.text === "美味深度制造中" || message.text === "🔍 正在检索知识库...")
  const hasReasoning = !isUser && message.reasoning

  return (
    <div
      className={cn(
        "flex gap-2.5 max-w-[78%] animate-msg-in",
        isUser ? "self-end flex-row-reverse" : "self-start",
        message.hasSource && !isUser && "[&>div:last-child]:animate-rag-pulse"
      )}
    >
      {/* Avatar */}
      <img
        src={avatarSrc}
        alt={isUser ? "用户头像" : "AI助手头像"}
        className={cn(
          "w-8 h-8 rounded-lg flex-shrink-0 object-cover",
          isUser ? "ring-2 ring-persimmon/30" : "ring-2 ring-wasabi/30"
        )}
      />

      {/* Body */}
      <div className="min-w-0">
        {/* Bubble */}
        <div
          className={cn(
            "px-4 py-3 text-sm leading-relaxed break-words",
            isUser
              ? "bg-persimmon-light text-persimmon rounded-[12px_12px_4px_12px] border border-persimmon/10"
              : [
                  "bg-white text-ink rounded-[12px_12px_12px_4px] border border-thread-light",
                  message.hasSource && "border-l-2 border-l-sprout",
                ]
          )}
        >
          {isWaiting ? (
            <span className="flex items-center gap-2">
              <span className="text-ink-muted">{message.text}</span>
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-sm bg-ink-muted animate-dot-bounce" />
                <span className="w-1.5 h-1.5 rounded-sm bg-ink-muted animate-dot-bounce [animation-delay:0.18s]" />
                <span className="w-1.5 h-1.5 rounded-sm bg-ink-muted animate-dot-bounce [animation-delay:0.36s]" />
              </span>
            </span>
          ) : isUser ? (
            // 用户消息纯文本（保留换行）
            <span className="whitespace-pre-wrap break-words">{message.text}</span>
          ) : (
            <>
              {/* 思考过程 — 折叠显示 */}
              {hasReasoning && (
                <details className="mb-2" open>
                  <summary className="text-[11px] font-semibold text-thinking cursor-pointer select-none hover:text-thinking-hi transition-colors">
                    🧠 思考过程
                  </summary>
                  <pre className="mt-1.5 text-[12px] text-ink-muted leading-relaxed whitespace-pre-wrap bg-thinking-bg/60 rounded-lg px-3 py-2 border border-thinking-soft max-h-[300px] overflow-y-auto custom-scroll">
                    {message.reasoning}
                  </pre>
                </details>
              )}
              {/* AI 回答：Markdown 渲染 */}
              <MarkdownRenderer>{message.text}</MarkdownRenderer>
            </>
          )}

          {/* Source badge */}
          {message.hasSource && message.sources && (
            <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 bg-wasabi-light text-wasabi text-[11px] font-medium rounded border-l-2 border-sprout">
              <span className="text-[6px]">◆</span>
              {message.sources}
            </div>
          )}
        </div>

        {/* Time */}
        <div
          className={cn(
            "text-[11px] text-ink-faint mt-1 px-1",
            isUser && "text-right"
          )}
        >
          {new Date(message.time).toLocaleString("zh-CN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  )
}
