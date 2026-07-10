/** 应用配置，可按环境切换 */

export const API_CONFIG = {
  /** 聊天 API 基础地址 — 生产环境置空，由 Nginx 代理 */
  baseURL: import.meta.env.VITE_API_BASE ?? "http://106.14.181.222:8000",
  /** 登录接口 */
  loginPath: "/api/v1/login",
  /** 聊天接口（流式） */
  chatPath: "/api/v1/chat",
  /** 会话列表 */
  conversationsPath: "/api/v1/conversations",
  /** 消息列表 */
  messagesPath: "/api/v1/messages",
  /** 系统提示词（后端决定是否使用） */
  systemPrompt: "你是锦点餐饮公司的智能回答助手",
  /** 流式请求 */
  stream: true,
} as const

function api(path: string): string {
  return `${API_CONFIG.baseURL}${path}`
}

/** 获取登录 API URL */
export function getLoginURL(): string {
  return api(API_CONFIG.loginPath)
}

/** 获取聊天 API URL */
export function getChatURL(): string {
  return api(API_CONFIG.chatPath)
}

/** 获取会话列表/创建 API URL */
export function getConversationsURL(): string {
  return api(API_CONFIG.conversationsPath)
}

/** 获取指定会话的操作 URL */
export function getConversationURL(conversationId: string): string {
  return `${api(API_CONFIG.conversationsPath)}/${conversationId}`
}

/** 获取消息列表 API URL */
export function getMessagesURL(conversationId: string): string {
  return `${api(API_CONFIG.messagesPath)}/${conversationId}`
}
