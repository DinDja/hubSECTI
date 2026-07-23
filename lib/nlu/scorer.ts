import type { KnowledgeEntry } from "@/lib/chatbot-knowledge"
import { tokenize } from "./tokenizer"
import { stemTokens } from "./stemmer"
import { removeStopwords } from "./stopwords"
import { similarity, levenshtein } from "./fuzzy"

export interface ScoredEntry {
  entry: KnowledgeEntry
  score: number
  matchedKeywords: string[]
}

export function scoreEntry(entry: KnowledgeEntry, queryTokens: string[], queryStems: string[]): ScoredEntry {
  let score = 0
  const matched: string[] = []

  const keywordTokens = entry.keywords.flatMap((k) => tokenize(k))
  const keywordStems = entry.keywords.flatMap((k) => stemTokens(tokenize(k)))
  const titleTokens = tokenize(entry.title)
  const contentTokens = tokenize(entry.content)
  const titleStems = stemTokens(titleTokens)

  for (let i = 0; i < queryTokens.length; i++) {
    const token = queryTokens[i]
    const stemmed = queryStems[i]

    const inKeywordToken = keywordTokens.some((k) => k === token || (token.length > 4 && k.includes(token)))
    const inKeywordStem = keywordStems.includes(stemmed)
    const inTitleToken = titleTokens.includes(token)
    const inTitleStem = titleStems.includes(stemmed)
    const inContent = contentTokens.includes(token)

    if (inKeywordToken || inKeywordStem) {
      score += 5
      matched.push(token)
    } else if (inTitleToken || inTitleStem) {
      score += 3
      matched.push(token)
    } else if (inContent) {
      score += 1
    } else {
      for (const kw of keywordTokens) {
        if (token.length >= 4 && kw.length >= 4) {
          const sim = similarity(token, kw)
          if (sim >= 0.82) {
            score += 2
            matched.push(`${token}~${kw}`)
            break
          }
        }
      }
    }
  }

  const queryNorm = queryTokens.join(" ")
  for (const kw of entry.keywords) {
    const kwNorm = kw.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim()
    if (queryNorm.includes(kwNorm) && kwNorm.length > 3) {
      score += 4
      if (!matched.includes(kw)) matched.push(kw)
    }
  }

  return { entry, score, matchedKeywords: matched }
}

export function rankEntries(entries: KnowledgeEntry[], query: string): ScoredEntry[] {
  const tokens = tokenize(query)
  const filtered = removeStopwords(tokens)
  if (filtered.length === 0 && tokens.length === 0) return []
  const queryStems = stemTokens(filtered.length > 0 ? filtered : tokens)

  const scored = entries
    .map((entry) => scoreEntry(entry, filtered.length > 0 ? filtered : tokens, queryStems))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored
}
