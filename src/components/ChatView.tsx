import { useApp } from "@/components/AppContext"
import { ChatMessage } from "@/components/ChatMessage"
import { WelcomeScreen } from "@/components/WelcomeScreen"
import { ChatInput, requestSend } from "@/components/ChatInput"
import { TypingIndicator } from "@/components/TypingIndicator"
import { useEffect, useRef } from "react"

export function ChatView() {
  const { state } = useApp()
  const scrollRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
      shouldAutoScroll.current = true
    }
  }, [state.activeConversationId])

  useEffect(() => {
    if (shouldAutoScroll.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
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
        className="flex-1 overflow-y-auto px-4 md:px-7 py-4 md:py-6 flex flex-col gap-4 md:gap-5 custom-scroll"
      >
        {state.messages.length === 0 && (
          <WelcomeScreen onChipClick={requestSend} />
        )}

        {state.messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        <TypingIndicator visible={state.isTyping} />
      </div>

      <ChatInput />
    </div>
  )
}
