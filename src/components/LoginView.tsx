import { useState, useEffect, useRef, type FormEvent } from "react"
import { useApp } from "@/components/AppContext"
import { loginAPI } from "@/services/api"

/** 登录过程中的阶段性文案 */
const LOADING_STAGES = ["验证中…", "获取权限…", "加载中…"]

export function LoginView() {
  const { state, dispatch } = useApp()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [shakeError, setShakeError] = useState(false)
  const [loadingStage, setLoadingStage] = useState(0)
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 登录中轮播文案
  useEffect(() => {
    if (loading) {
      setLoadingStage(0)
      loadingTimerRef.current = setInterval(() => {
        setLoadingStage((s) => (s + 1) % LOADING_STAGES.length)
      }, 800)
    } else {
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current)
    }
    return () => { if (loadingTimerRef.current) clearInterval(loadingTimerRef.current) }
  }, [loading])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const u = username.trim()
    const p = password.trim()
    if (!u) {
      setShakeError(true)
      dispatch({ type: "SET_LOGIN_ERROR", error: "请输入账号" })
      setTimeout(() => setShakeError(false), 500)
      return
    }
    if (!p) {
      setShakeError(true)
      dispatch({ type: "SET_LOGIN_ERROR", error: "请输入密码" })
      setTimeout(() => setShakeError(false), 500)
      return
    }

    setLoading(true)
    dispatch({ type: "SET_LOGIN_ERROR", error: "" })

    try {
      const user = await loginAPI(u, p)
      setSuccess(true)
      // 短暂展示成功态后切入主应用
      setTimeout(() => dispatch({ type: "LOGIN", user }), 600)
    } catch (err) {
      setShakeError(true)
      setTimeout(() => setShakeError(false), 500)
      dispatch({ type: "SET_LOGIN_ERROR", error: err instanceof Error ? err.message : "登录失败，请重试" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-full flex items-center justify-center app-bg-animated px-4 overflow-hidden">
      {/* 动态背景光晕 */}
      <div
        className="fixed inset-0 pointer-events-none opacity-25 login-bg-animated"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 80%, rgba(224,85,31,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(74,107,64,0.06) 0%, transparent 50%)",
        }}
      />

      <div
        className={`relative w-full max-w-[400px] bg-white rounded-2xl shadow-[0_4px_48px_rgba(45,39,32,0.08),0_0_0_1px_#F3EDE6] p-6 sm:p-10 ${
          success ? "animate-login-card-out" : `animate-login-card ${shakeError ? "animate-login-shake" : ""}`
        }`}
      >
        {/* Logo 区域 — 入场延迟 1 */}
        <div className="flex flex-col items-center mb-8 animate-login-item login-delay-1">
          <img
            src="/icon-purple.svg"
            alt="锦灵智拌助手"
            className="w-16 h-16 mb-4 animate-logo-breathe drop-shadow-[0_2px_8px_rgba(224,85,31,0.15)]"
          />
          <h1 className="font-display text-[22px] font-black text-ink tracking-[0.03em]">
            锦灵智拌助手
          </h1>
          <p className="text-xs text-ink-muted mt-1.5">
            餐饮AI知识陪伴 · 管理端
          </p>
        </div>

        {/* 表单 — 入场延迟 2 */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-login-item login-delay-2">
          {/* 账号 */}
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5 tracking-[0.03em] uppercase">
              账号
            </label>
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted group-focus-within:text-persimmon transition-colors duration-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入账号"
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 text-sm text-ink bg-parchment border border-thread rounded-lg focus:bg-white focus:border-persimmon focus:shadow-[0_0_0_3px_rgba(224,85,31,0.08)] outline-none transition-all duration-300 placeholder:text-ink-faint"
              />
            </div>
          </div>

          {/* 密码 */}
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5 tracking-[0.03em] uppercase">
              密码
            </label>
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted group-focus-within:text-persimmon transition-colors duration-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(e) }}
                className="w-full pl-10 pr-10 py-2.5 text-sm text-ink bg-parchment border border-thread rounded-lg focus:bg-white focus:border-persimmon focus:shadow-[0_0_0_3px_rgba(224,85,31,0.08)] outline-none transition-all duration-300 placeholder:text-ink-faint"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink active:scale-90 transition-all"
                tabIndex={-1}
              >
                {showPw ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* 错误提示 — 带入场动画 */}
          {state.loginError && (
            <div className="flex items-center gap-1.5 text-[13px] text-red-500 bg-red-50 px-3 py-2 rounded-lg animate-login-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {state.loginError}
            </div>
          )}

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 text-[14px] font-bold rounded-lg transition-all duration-300 mt-1 flex items-center justify-center gap-2 ${
              success
                ? "bg-wasabi text-white shadow-[0_4px_12px_rgba(74,107,64,0.3)]"
                : "bg-persimmon text-white hover:bg-persimmon-hi hover:shadow-[0_4px_12px_rgba(224,85,31,0.3)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            }`}
          >
            {success ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                  className="[&>polyline]:[stroke-dasharray:24] [&>polyline]:[stroke-dashoffset:24] [&>polyline]:[animation:login-check-draw_0.35s_ease-out_0.1s_forwards]">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                登录成功
              </>
            ) : loading ? (
              <>
                <span className="flex gap-0.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-dot-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-dot-bounce" style={{ animationDelay: "0.15s" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-dot-bounce" style={{ animationDelay: "0.3s" }} />
                </span>
                {LOADING_STAGES[loadingStage]}
              </>
            ) : (
              "登 录"
            )}
          </button>
        </form>

        {/* 底部文字 — 入场延迟 3 */}
        <p className="text-center text-[11px] text-ink-faint mt-6 animate-login-item login-delay-3">
          锦点餐饮 · 智能助手平台
        </p>
      </div>
    </div>
  )
}
