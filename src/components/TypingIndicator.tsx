import { cn } from "@/lib/utils"

export function TypingIndicator({ visible }: { visible: boolean }) {
  return (
    <div
      className={cn(
        "flex gap-2.5 max-w-[78%] self-start",
        visible ? "flex" : "hidden"
      )}
    >
      {/* AI 头像 — 跟 ChatMessage 一致 */}
      <img
        src="/icon-purple.svg"
        alt="AI助手头像"
        className="w-8 h-8 rounded-lg flex-shrink-0 object-cover ring-2 ring-wasabi/30"
      />

      {/* 气泡 — 跟 ChatMessage AI 气泡一致 */}
      <div className="min-w-0">
        <div className="px-4 py-3 text-sm bg-white text-ink rounded-[12px_12px_12px_4px] border border-thread-light flex items-center gap-2">
          <span className="text-ink-muted">美味即将到来</span>
          <span className="flex gap-1 items-center">
            <span className="w-1.5 h-1.5 rounded-sm bg-ink-muted animate-dot-bounce" />
            <span className="w-1.5 h-1.5 rounded-sm bg-ink-muted animate-dot-bounce [animation-delay:0.18s]" />
            <span className="w-1.5 h-1.5 rounded-sm bg-ink-muted animate-dot-bounce [animation-delay:0.36s]" />
          </span>
        </div>
      </div>
    </div>
  )
}
