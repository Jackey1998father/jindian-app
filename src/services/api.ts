import type { ChatMessage } from "@/types"
import { API_CONFIG, getChatURL } from "@/config"

interface APIMessage {
  role: "system" | "user" | "assistant"
  content: string
}

/** 将应用内的 ChatMessage[] 转为 API 格式，附带 system prompt */
export function buildAPIMessages(messages: ChatMessage[]): APIMessage[] {
  return [
    { role: "system", content: API_CONFIG.systemPrompt },
    ...messages.map((m) => ({
      role: m.role === "ai" ? "assistant" as const : (m.role as "user"),
      content: m.text,
    })),
  ]
}

/**
 * 流式调用聊天 API
 * @param messages 应用内消息列表
 * @param onChunk 每收到一个文本块时回调
 * @returns 完整响应文本
 */
export async function chatStream(
  messages: ChatMessage[],
  onChunk: (text: string) => void,
): Promise<string> {
  const apiMessages = buildAPIMessages(messages)

  const response = await fetch(getChatURL(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: apiMessages,
      stream: API_CONFIG.stream,
      max_rounds: API_CONFIG.maxRounds,
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => "")
    throw new Error(`API 请求失败 (${response.status}): ${errText || response.statusText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error("不支持流式响应")

  const decoder = new TextDecoder()
  let fullText = ""
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() || ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith("data: ")) continue

      const data = trimmed.slice(6)
      if (data === "[DONE]") return fullText

      try {
        const chunk = JSON.parse(data)
        const content = chunk.choices?.[0]?.delta?.content
        if (content) {
          fullText += content
          onChunk(content)
        }
      } catch {
        // 跳过无法解析的行
      }
    }
  }

  return fullText
}
