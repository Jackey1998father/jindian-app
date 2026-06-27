import type { KnowledgeBase, RAGResult } from "@/types"

const STOP_WORDS = new Set([
  "的","了","在","是","我","有","和","就","不","人","都","一","一个","上","也","很","到","说","要","去","你","会","着",
  "没有","看","好","自己","这","他","她","它","们","那","些","什么","怎么","如何","为什么","可以","能","吗","呢",
  "吧","啊","哦","嗯",
])

function extractKeywords(text: string): string[] {
  const cleaned = text.replace(/[，。！？、；：""''（）【】《》\s,\.!\?;:'"()\[\]{}]+/g, "|")
  const segments = cleaned.split("|").filter((s) => s.length >= 2)
  const keywords = segments.filter((s) => !STOP_WORDS.has(s))
  const chars = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "").split("")
  return [...new Set([...keywords, ...chars.filter((c) => !STOP_WORDS.has(c))])]
}

export function searchRelevant(
  query: string,
  knowledgeBases: KnowledgeBase[]
): RAGResult[] {
  if (!knowledgeBases.length) return []
  const keywords = extractKeywords(query)
  if (!keywords.length) return []

  const results: RAGResult[] = []
  for (const kb of knowledgeBases) {
    if (!kb.documents.length) continue
    for (const doc of kb.documents) {
      let score = 0
      const cL = doc.content.toLowerCase()
      const tL = doc.title.toLowerCase()
      for (const kw of keywords) {
        const kwL = kw.toLowerCase()
        const escaped = kwL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        score += (cL.match(new RegExp(escaped, "g")) || []).length * 2
        if (tL.includes(kwL)) score += 5
      }
      if (score > 0) {
        results.push({
          kb: kb.name,
          kbId: kb.id,
          title: doc.title,
          content: doc.content,
          score,
        })
      }
    }
  }
  return results.sort((a, b) => b.score - a.score).slice(0, 3)
}

export function generateAIResponse(
  query: string,
  knowledgeBases: KnowledgeBase[]
): { text: string; hasSource: boolean; sources: string | null } {
  const relevant = searchRelevant(query, knowledgeBases)

  if (relevant.length > 0) {
    const context = relevant.map((r) => r.content).join("\n")
    const sources = relevant.map((r) => `「${r.kb}」${r.title}`).join("、")
    const sentences = context.split(/[。！？\n]+/).filter((s) => s.trim().length > 5)
    const matchingSentences = sentences.filter((s) =>
      extractKeywords(query).some((kw) => s.toLowerCase().includes(kw.toLowerCase()))
    )
    const body =
      (matchingSentences.length > 0 ? matchingSentences : sentences).slice(0, 3).join("。") + "。"
    return {
      text: `根据知识库中的资料，为您找到以下相关信息：\n\n${body}\n\n━━━━━━\n来源：${sources}`,
      hasSource: true,
      sources,
    }
  }

  const generic = [
    `关于「${query}」这个问题，目前知识库中还没有找到相关资料。\n\n您可以在管理端添加餐饮运营文档、菜单信息等内容，添加后我就能精准回答了。`,
    `暂时没有在知识库中找到匹配「${query}」的内容。\n\n建议您添加以下类型的知识文档：菜单与价格、服务流程标准、食品安全规范、营销活动方案等。`,
  ]
  return {
    text: generic[Math.floor(Math.random() * generic.length)],
    hasSource: false,
    sources: null,
  }
}
