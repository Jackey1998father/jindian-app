import { type Components } from "react-markdown"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import type { ChatMessage as ChatMessageType } from "@/types"
import { cn } from "@/lib/utils"

/** Tailwind 风格的自定义 Markdown 组件 */
const mdComponents: Partial<Components> = {
  // 标题
  h1: ({ children }) => (
    <h1 className="text-base font-bold text-ink mt-3 mb-1.5 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-[15px] font-bold text-ink mt-2.5 mb-1 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-ink mt-2 mb-0.5 first:mt-0">{children}</h3>
  ),
  // 加粗 / 斜体
  strong: ({ children }) => (
    <strong className="font-bold text-ink">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-ink-muted">{children}</em>
  ),
  // 段落
  p: ({ children }) => (
    <p className="my-0.5 first:mt-0 last:mb-0">{children}</p>
  ),
  // 有序 / 无序列表
  ul: ({ children }) => (
    <ul className="list-disc pl-4 my-1 space-y-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-4 my-1 space-y-0.5">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-sm text-ink leading-relaxed">{children}</li>
  ),
  // 行内代码
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-")
    if (isBlock) {
      return (
        <pre className="bg-parchment rounded-md px-3 py-2 my-1.5 text-[13px] leading-relaxed overflow-x-auto text-ink">
          <code>{children}</code>
        </pre>
      )
    }
    return (
      <code className="bg-parchment text-[13px] px-1 py-0.5 rounded text-wasabi font-medium">
        {children}
      </code>
    )
  },
  // 分割线
  hr: () => <hr className="my-2 border-thread" />,
  // 引用
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-sprout pl-3 my-1.5 text-ink-muted italic text-[13px]">
      {children}
    </blockquote>
  ),
  // 链接
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-persimmon underline underline-offset-2 hover:text-persimmon-hi transition-colors"
    >
      {children}
    </a>
  ),
  // 表格
  table: ({ children }) => (
    <div className="overflow-x-auto my-1.5">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-parchment">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border border-thread px-2.5 py-1.5 text-left font-semibold text-ink text-[13px]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-thread px-2.5 py-1.5 text-ink text-[13px]">{children}</td>
  ),
}

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user"
  const avatarSrc = isUser ? "/avatars/user-avatar.png" : "/icon-purple.svg"
  const isWaiting = !isUser && message.text === "美味即将到来"

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
                  "markdown-body",
                  message.hasSource && "border-l-2 border-l-sprout",
                ]
          )}
        >
          {isWaiting ? (
            <span className="flex items-center gap-2">
              <span className="text-ink-muted">美味即将到来</span>
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-sm bg-ink-muted animate-dot-bounce" />
                <span className="w-1.5 h-1.5 rounded-sm bg-ink-muted animate-dot-bounce [animation-delay:0.18s]" />
                <span className="w-1.5 h-1.5 rounded-sm bg-ink-muted animate-dot-bounce [animation-delay:0.36s]" />
              </span>
            </span>
          ) : isUser ? (
            // 用户消息纯文本
            message.text
          ) : (
            // AI 消息：Markdown 渲染
            <ReactMarkdown components={mdComponents} rehypePlugins={[rehypeRaw]}>
              {message.text}
            </ReactMarkdown>
          )}

          {/* Source badge */}
          {message.hasSource && message.sources && (
            <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 bg-[#EBF4E8] text-wasabi text-[11px] font-medium rounded border-l-2 border-sprout">
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
