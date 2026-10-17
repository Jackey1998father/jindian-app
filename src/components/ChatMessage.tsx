import { useEffect, useRef, useState } from "react"
import type { ChatMessage as ChatMessageType } from "@/types"
import { MarkdownRenderer } from "@/components/MarkdownRenderer"
import { cn } from "@/lib/utils"

/**
 * 把回答里的「参考资料 N」引用替换成角标 <sup>N</sup>。
 * 支持【参考资料 1】/ 参考资料 1 /【参考资料 1、2、3】等形式，
 * 供 MarkdownRenderer 的 sup 组件渲染成小角标，与来源卡片数字一一对应。
 */
function renderCitations(text: string): string {
  return text.replace(
    /【?参考资料\s*(\d+(?:[、，,\s]+\d+)*)】?/g,
    (_m, nums: string) =>
      nums
        .split(/[、，,\s]+/)
        .filter(Boolean)
        .map((n: string) => `<sup>${n}</sup>`)
        .join(""),
  )
}

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user"
  const avatarSrc = isUser ? "/avatars/user-avatar.png" : "/icon-purple.svg"
  // 回答正文尚未开始输出（仍是占位文案）
  const isPlaceholder = !isUser && (message.text === "美味即将到来" || message.text === "美味深度制造中" || message.text === "🔍 正在检索知识库...")
  const hasReasoning = !isUser && !!message.reasoning
  // 思考进行中：已有思考内容但正文还没开始
  const isThinking = hasReasoning && isPlaceholder
  const reasoningPreRef = useRef<HTMLPreElement>(null)
  const [reasoningOpen, setReasoningOpen] = useState(true)
  // 思考进行中时强制展开
  const reasoningExpanded = isThinking ? true : reasoningOpen

  // 思考流式输出时，思考面板自动滚到底部
  useEffect(() => {
    if (isThinking && reasoningPreRef.current) {
      reasoningPreRef.current.scrollTop = reasoningPreRef.current.scrollHeight
    }
  }, [message.reasoning, isThinking])

  return (
    <div
      className={cn(
        "flex gap-2.5 max-w-[95%] animate-msg-in",
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
          {isUser ? (
            <div className="space-y-2">
              {/* 用户上传的图片（视觉模型） */}
              {message.images && message.images.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {message.images.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`图片 ${i + 1}`}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-md object-cover border border-thread-light"
                    />
                  ))}
                </div>
              )}
              {/* 用户消息纯文本（保留换行） */}
              {message.text && (
                <span className="whitespace-pre-wrap break-words">{message.text}</span>
              )}
            </div>
          ) : (
            <>
              {/* 思考过程 — 折叠显示（思考中随流式输出实时渲染） */}
              {hasReasoning && (
                <div className="mb-2">
                  <button
                    type="button"
                    onClick={() => !isThinking && setReasoningOpen(v => !v)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-thinking cursor-pointer select-none hover:text-thinking-hi transition-colors"
                  >
                    <span className={cn(
                      "inline-block text-[8px] transition-transform duration-300 ease-out",
                      reasoningExpanded ? "rotate-90" : "rotate-0"
                    )}>
                      ▶
                    </span>
                    🧠 {isThinking ? "思考中…" : "思考过程"}
                  </button>
                  <div
                    className="grid transition-all duration-300 ease-in-out"
                    style={{ gridTemplateRows: reasoningExpanded ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <pre ref={reasoningPreRef} className="mt-1.5 text-[12px] text-ink-muted leading-relaxed whitespace-pre-wrap bg-thinking-bg/60 rounded-lg px-3 py-2 border border-thinking-soft max-h-[300px] overflow-y-auto custom-scroll">
                        {message.reasoning}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
              {/* AI 回答：正文未开始时显示等待动画，开始后 Markdown 渲染 */}
              {isPlaceholder ? (
                <span className="flex items-center gap-2">
                  <span className="text-ink-muted">{message.text}</span>
                  <span className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-sm bg-ink-muted animate-dot-bounce" />
                    <span className="w-1.5 h-1.5 rounded-sm bg-ink-muted animate-dot-bounce [animation-delay:0.18s]" />
                    <span className="w-1.5 h-1.5 rounded-sm bg-ink-muted animate-dot-bounce [animation-delay:0.36s]" />
                  </span>
                </span>
              ) : (
                <MarkdownRenderer>
                  {message.sources && message.sources.length > 0
                    ? renderCitations(message.text)
                    : message.text}
                </MarkdownRenderer>
              )}
            </>
          )}

          {/* 参考来源卡片（角标与「参考资料 N」一一对应） */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-thread-light">
              <div className="text-[11px] font-semibold text-ink-muted mb-2">参考来源</div>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((s) => (
                  <div
                    key={s.index}
                    className="inline-flex items-center gap-1.5 px-2 py-1.5 bg-parchment rounded-lg border border-thread"
                    title={s.title}
                  >
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-md bg-sprout text-white text-[11px] font-bold leading-none">
                      {s.index}
                    </span>
                    <span className="text-[12px] text-ink truncate max-w-[180px]">
                      {s.title || "未命名文档"}
                    </span>
                  </div>
                ))}
              </div>
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
