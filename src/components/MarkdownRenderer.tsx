import { type Components } from "react-markdown"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

/** Tailwind 风格的自定义 Markdown 组件（供聊天、文档预览等复用） */
export const mdComponents: Partial<Components> = {
  // 标题
  h1: ({ children }) => (
    <h1 className="text-base font-bold text-ink mt-3 mb-1.5 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-[15px] font-bold text-ink mt-2.5 mb-1 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-ink mt-2 mb-0.5 first:mt-0">{children}</h3>
  ),
  // 加粗 / 斜体
  strong: ({ children }) => (
    <strong className="font-bold text-ink">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-ink-muted">{children}</em>
  ),
  // 段落
  p: ({ children }) => (
    <p className="my-0.5 first:mt-0 last:mb-0">{children}</p>
  ),
  // 有序 / 无序列表
  ul: ({ children }) => (
    <ul className="list-disc pl-4 my-1 space-y-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-4 my-1 space-y-0.5">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-sm text-ink leading-relaxed">{children}</li>
  ),
  // 行内代码 / 代码块
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-")
    if (isBlock) {
      return (
        <pre className="bg-parchment rounded-md px-3 py-2 my-1.5 text-[13px] leading-relaxed overflow-x-auto text-ink border border-thread">
          <code>{children}</code>
        </pre>
      )
    }
    return (
      <code className="bg-parchment text-[13px] px-1 py-0.5 rounded text-wasabi font-medium border border-thread">
        {children}
      </code>
    )
  },
  // 分割线
  hr: () => <hr className="my-2 border-thread" />,
  // 引用
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-sprout pl-3 my-1.5 text-ink-muted italic text-[13px]">
      {children}
    </blockquote>
  ),
  // 链接
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-persimmon underline underline-offset-2 hover:text-persimmon-hi transition-colors"
    >
      {children}
    </a>
  ),
  // 表格
  table: ({ children }) => (
    <div className="overflow-x-auto my-2 rounded-lg border border-thread">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-parchment border-b border-thread">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-thread-light">{children}</tbody>
  ),
  th: ({ children }) => (
    <th className="border-r border-thread last:border-r-0 px-3 py-2 text-left font-semibold text-ink text-[13px] whitespace-nowrap">
      {children}
    </th>
  ),
  tr: ({ children }) => (
    <tr className="even:bg-parchment/50">{children}</tr>
  ),
  td: ({ children }) => (
    <td className="border-r border-thread-light last:border-r-0 px-3 py-1.5 text-ink text-[13px]">
      {children}
    </td>
  ),
}

interface MarkdownRendererProps {
  children: string
  className?: string
}

export function MarkdownRenderer({ children, className }: MarkdownRendererProps) {
  return (
    <div className={cn("markdown-renderer", className)}>
      <ReactMarkdown components={mdComponents} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
