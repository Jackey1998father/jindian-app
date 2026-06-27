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
      <div className="flex flex-col h-screen w-full bg-white shadow-[0_0_0_1px_#F3EDE6]">
        <ToastContainer />
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <main className="flex-1 overflow-hidden flex flex-col bg-white">
            {state.view === "chat" && <ChatView />}
            {state.view === "kb-list" && <KBListView />}
            {state.view === "kb-detail" && <KBDetailView />}
          </main>
        </div>
      </div>
    </AppCtx>
  )
}
