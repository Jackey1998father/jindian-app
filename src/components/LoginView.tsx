import { useState, type FormEvent } from "react"
import { useApp } from "@/components/AppContext"

export function LoginView() {
  const { state, dispatch } = useApp()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    dispatch({ type: "LOGIN", username, password })
  }

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#FDF9F5] px-4">
      {/* 背景装饰 */}
      <div className="fixed inset-0 pointer-events-none opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 80%, rgba(224,85,31,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(74,107,64,0.04) 0%, transparent 50%)" }} />

      <div className="relative w-full max-w-[400px] bg-white rounded-2xl shadow-[0_4px_48px_rgba(45,39,32,0.08),0_0_0_1px_#F3EDE6] p-6 sm:p-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/icon-purple.svg"
            alt="锦灵智拌助手"
            className="w-16 h-16 mb-4"
          />
          <h1 className="font-display text-[22px] font-black text-ink tracking-[0.03em]">
            锦灵智拌助手
          </h1>
          <p className="text-xs text-ink-muted mt-1.5">
            餐饮AI知识陪伴 · 管理端
          </p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* 账号 */}
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5 tracking-[0.03em] uppercase">
              账号
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted">
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
                className="w-full pl-10 pr-4 py-2.5 text-sm text-ink bg-parchment border border-thread rounded-lg focus:bg-white focus:border-persimmon focus:shadow-[0_0_0_3px_rgba(224,85,31,0.08)] outline-none transition-all placeholder:text-ink-faint"
              />
            </div>
          </div>

          {/* 密码 */}
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5 tracking-[0.03em] uppercase">
              密码
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted">
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
                className="w-full pl-10 pr-10 py-2.5 text-sm text-ink bg-parchment border border-thread rounded-lg focus:bg-white focus:border-persimmon focus:shadow-[0_0_0_3px_rgba(224,85,31,0.08)] outline-none transition-all placeholder:text-ink-faint"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
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

          {/* 错误提示 */}
          {state.loginError && (
            <div className="flex items-center gap-1.5 text-[13px] text-red-500 bg-red-50 px-3 py-2 rounded-lg">
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
            className="w-full py-2.5 text-[14px] font-bold text-white bg-persimmon rounded-lg hover:bg-persimmon-hi hover:shadow-[0_4px_12px_rgba(224,85,31,0.3)] active:scale-[0.98] transition-all duration-200 mt-1"
          >
            登 录
          </button>
        </form>

        <p className="text-center text-[11px] text-ink-faint mt-6">
          任意输入账号密码即可体验
        </p>
      </div>
    </div>
  )
}
