import { useState } from "react"
import { useAppState } from "@/hooks/useApp"
import { AppCtx } from "@/components/AppContext"
import { Header } from "@/components/Header"
import { Sidebar } from "@/components/Sidebar"
import { ChatView } from "@/components/ChatView"
import { KBListView } from "@/components/KBListView"
import { KBDetailView } from "@/components/KBDetailView"
import { LoginView } from "@/components/LoginView"
import { ToastContainer } from "@/components/Toast"

export default function App() {
  const { state, dispatch } = useAppState()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // 未登录 → 显示登录页
  if (!state.isLoggedIn) {
    return (
      <AppCtx value={{ state, dispatch }}>
        <LoginView />
      </AppCtx>
    )
  }

  // 已登录 → 显示主应用
  return (
    <AppCtx value={{ state, dispatch }}>
      <div className="flex flex-col h-dvh w-full shadow-[0_0_0_1px_#F3EDE6] animate-app-in">
        <ToastContainer />
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <main className="flex-1 overflow-hidden flex flex-col app-bg-animated">
            {/* key 随视图变化触发重挂载，切换时播放入场过渡 */}
            <div key={state.view} className="flex-1 flex flex-col overflow-hidden animate-view-in">
              {state.view === "chat" && <ChatView />}
              {state.view === "kb-list" && <KBListView />}
              {state.view === "kb-detail" && <KBDetailView />}
            </div>
          </main>
        </div>
      </div>
    </AppCtx>
  )
}
