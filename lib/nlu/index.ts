export { normalize, tokenize, ngrams, allGrams } from "./tokenizer"
export { stem, stemTokens } from "./stemmer"
export { STOPWORDS_PT, removeStopwords } from "./stopwords"
export { levenshtein, similarity, fuzzyContains, bestFuzzyMatch } from "./fuzzy"
export { rankEntries, scoreEntry, type ScoredEntry } from "./scorer"
export { detectIntent, type Intent, type IntentResult } from "./intent"

import { tokenize } from "./tokenizer"
import { stemTokens } from "./stemmer"
import { removeStopwords } from "./stopwords"
import { rankEntries } from "./scorer"
import { detectIntent, type Intent, type IntentResult } from "./intent"
import type { KnowledgeEntry } from "@/lib/chatbot-knowledge"

export interface NluResult {
  intent: Intent
  intentConfidence: number
  intentEntities: string[]
  queryTokensRaw: string[]
  queryTokens: string[]
  queryStems: string[]
  rankedEntries: import("./scorer").ScoredEntry[]
}

export function processQuery(query: string, knowledgeBase: KnowledgeEntry[]): NluResult {
  const tokensRaw = tokenize(query)
  const tokens = removeStopwords(tokensRaw)
  const stems = stemTokens(tokens.length > 0 ? tokens : tokensRaw)
  const intentResult: IntentResult = detectIntent(query)
  const rankedEntries = rankEntries(knowledgeBase, query)

  return {
    intent: intentResult.intent,
    intentConfidence: intentResult.confidence,
    intentEntities: intentResult.entities,
    queryTokensRaw: tokensRaw,
    queryTokens: tokens.length > 0 ? tokens : tokensRaw,
    queryStems: stems,
    rankedEntries,
  }
}

export function extractSearchTerms(query: string, intent: Intent): string {
  if (intent !== "projetos_search" && intent !== "systems_search") return ""

  const tokens = removeStopwords(tokenize(query))

  const stopPatterns = new Set([
    "buscar", "pesquisar", "encontrar", "procurar", "lista", "listar",
    "quais", "tem", "existe", "sobre", "sistema", "sistemas", "projeto",
    "projetos",
  ])

  const filtered = tokens.filter((t) => !stopPatterns.has(t))

  return (filtered.length > 0 ? filtered : tokens).slice(0, 8).join(" ")
}
