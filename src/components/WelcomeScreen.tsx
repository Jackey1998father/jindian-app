import { useEffect, useState } from "react"

const QUICK_CHIPS = [
  { q: "招牌菜有哪些推荐？", label: "招牌菜推荐" },
  { q: "餐厅的营业时间是什么？", label: "营业时间" },
  { q: "有什么优惠活动吗？", label: "优惠活动" },
  { q: "介绍一下你们的特色服务", label: "特色服务" },
]

/** 打字机效果：逐字显示文本，全部打出后 done 变为 true */
function useTypewriter(text: string, speed = 60, startDelay = 0, enabled = true) {
  const [display, setDisplay] = useState("")
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let interval: ReturnType<typeof setInterval> | undefined
    let startTimer: ReturnType<typeof setTimeout> | undefined

    startTimer = setTimeout(() => {
      let i = 0
      interval = setInterval(() => {
        i += 1
        setDisplay(text.slice(0, i))
        if (i >= text.length) {
          if (interval) clearInterval(interval)
          setDone(true)
        }
      }, speed)
    }, startDelay)

    return () => {
      if (startTimer) clearTimeout(startTimer)
      if (interval) clearInterval(interval)
    }
  }, [text, speed, startDelay, enabled])

  return { display, done }
}

/** 打字中的闪烁光标 */
function Caret() {
  return (
    <span className="inline-block w-[2px] h-[0.95em] align-[-0.1em] ml-[2px] bg-persimmon animate-pulse" />
  )
}

export function WelcomeScreen({
  onChipClick,
}: {
  /** 点击快捷标签时调用，传入完整问题文本（只填入输入框，不自动发送） */
  onChipClick: (query: string) => void
}) {
  const TITLE = "您好锦鲤，我是您的智拌助手"
  const TITLE_PLAIN_LEN = "您好锦鲤，".length
  const SUBTITLE =
    "我可以回答餐饮经营相关的各种问题。\n添加知识库后，我将基于您的专属资料精准应答。"

  // 先打标题，标题完成后再打副标题
  const title = useTypewriter(TITLE, 70, 500)
  const subtitle = useTypewriter(SUBTITLE, 45, 0, title.done)
  const allDone = title.done && subtitle.done

  return (
    <div className="flex flex-col items-center pt-8 md:pt-12 pb-12 md:pb-16 text-center px-4">
      {/* Animated mark — 带品牌光晕 */}
      <div className="relative mb-2 md:mb-3 animate-welcome-float">
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-60"
          style={{ background: "radial-gradient(circle, rgba(224,85,31,0.18) 0%, rgba(137,168,126,0.14) 60%, transparent 100%)" }}
        />
        <img
          src="/icon-purple.svg"
          alt="锦灵智拌助手"
          className="relative w-24 h-24 md:w-36 md:h-36 drop-shadow-[0_6px_20px_rgba(224,85,31,0.12)]"
        />
      </div>

      <h1 className="font-display text-[24px] md:text-[28px] font-black text-ink mb-2 md:mb-3 tracking-[0.03em] min-h-[1.2em]">
        {title.display.slice(0, TITLE_PLAIN_LEN)}
        <span className="bg-gradient-to-r from-persimmon to-wasabi bg-clip-text text-transparent">
          {title.display.slice(TITLE_PLAIN_LEN)}
        </span>
        {!title.done && <Caret />}
      </h1>
      <p className="text-sm text-ink-soft max-w-[320px] md:max-w-[380px] leading-relaxed mb-5 md:mb-7 mx-auto min-h-[2.6em]">
        {subtitle.display.split("\n").map((line, i, arr) => (
          <span key={i}>
            {line}
            {i < arr.length - 1 && <br />}
          </span>
        ))}
        {!subtitle.done && <Caret />}
      </p>

      {/* Quick chips — 文字打完后再浮现 */}
      <div
        className={`flex flex-wrap gap-2 justify-center transition-all duration-700 ${
          allDone ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip.q}
            onClick={() => onChipClick(chip.q)}
            className="px-3 md:px-4 py-2 text-[12px] md:text-[13px] font-medium text-ink-soft bg-white rounded-lg border border-thread shadow-[0_1px_2px_rgba(45,39,32,0.04)] hover:bg-white hover:border-persimmon hover:text-persimmon hover:shadow-[0_4px_16px_rgba(224,85,31,0.12)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export { QUICK_CHIPS }
