const QUICK_CHIPS = [
  { q: "招牌菜有哪些推荐？", label: "招牌菜推荐" },
  { q: "餐厅的营业时间是什么？", label: "营业时间" },
  { q: "有什么优惠活动吗？", label: "优惠活动" },
  { q: "介绍一下你们的特色服务", label: "特色服务" },
]

export function WelcomeScreen({
  onChipClick,
}: {
  onChipClick: (query: string) => void
}) {
  return (
    <div className="flex flex-col items-center pt-8 md:pt-12 pb-12 md:pb-16 text-center px-4">
      {/* Animated mark */}
      <div className="mb-2 md:mb-3 animate-welcome-float">
        <img
          src="/icon-purple.svg"
          alt="锦灵智拌助手"
          className="w-24 h-24 md:w-36 md:h-36"
        />
      </div>

      <h1 className="font-display text-[22px] md:text-[26px] font-black text-ink mb-2 md:mb-3 tracking-[0.03em]">
        您好锦鲤，我是智拌
      </h1>
      <p className="text-sm text-ink-soft max-w-[320px] md:max-w-[380px] leading-relaxed mb-5 md:mb-7 mx-auto">
        我可以回答餐饮经营相关的各种问题。
        <br />
        添加知识库后，我将基于您的专属资料精准应答。
      </p>

      {/* Quick chips */}
      <div className="flex flex-wrap gap-2 justify-center">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip.q}
            onClick={() => onChipClick(chip.q)}
            className="px-3 md:px-4 py-2 text-[12px] md:text-[13px] font-medium text-ink-soft bg-parchment rounded-lg border border-thread-light hover:bg-white hover:border-persimmon hover:text-persimmon transition-all duration-200"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export { QUICK_CHIPS }
