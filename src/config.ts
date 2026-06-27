/** 应用配置，可按环境切换 */

export const API_CONFIG = {
  /** 聊天 API 基础地址 — 生产环境置空，由 Nginx 代理 */
  baseURL: import.meta.env.VITE_API_BASE ?? "http://106.14.181.222:8000",
  /** 聊天接口路径 */
  chatPath: "/api/v1/chat",
  /** 系统提示词 */
  systemPrompt: "你是锦点餐饮公司的智能回答助手",
  /** 流式请求 */
  stream: true,
  /** 上下文轮数 */
  maxRounds: 3,
} as const

/** 获取完整 API URL */
export function getChatURL(): string {
  return `${API_CONFIG.baseURL}${API_CONFIG.chatPath}`
}
