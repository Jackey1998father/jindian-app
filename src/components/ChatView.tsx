import { useApp } from "@/components/AppContext"
import { ChatMessage } from "@/components/ChatMessage"
import { WelcomeScreen } from "@/components/WelcomeScreen"
import { ChatInput, requestFill } from "@/components/ChatInput"
import { TypingIndicator } from "@/components/TypingIndicator"
import { useEffect, useRef } from "react"

export function ChatView() {
  const { state } = useApp()
  const scrollRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)
  const prevMsgCount = useRef(0)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
      shouldAutoScroll.current = true
    }
    prevMsgCount.current = state.messages.length
  }, [state.activeConversationId])

  useEffect(() => {
    const currentCount = state.messages.length
    // 消息数量增加 = 发送了新消息，强制滚动到底部
    const isNewMessage = currentCount > prevMsgCount.current
    if (isNewMessage) {
      shouldAutoScroll.current = true
    }
    prevMsgCount.current = currentCount

    if (shouldAutoScroll.current && scrollRef.current) {
      // 新消息用平滑滚动，流式追加用瞬时滚动
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: isNewMessage ? "smooth" : "auto",
      })
    }
  }, [state.messages, state.isTyping])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 64
    shouldAutoScroll.current = atBottom
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 md:px-7 py-4 md:py-6 custom-scroll"
      >
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-4 md:gap-5">
          {state.messages.length === 0 && (
            <WelcomeScreen onChipClick={requestFill} />
          )}

          {state.messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          <TypingIndicator visible={state.isTyping} />
        </div>
      </div>

      <ChatInput />
    </div>
  )
}
