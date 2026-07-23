import { tokenize } from "./tokenizer"
import { stemTokens } from "./stemmer"
import { removeStopwords } from "./stopwords"
import { similarity } from "./fuzzy"

export type Intent =
  | "projetos_stats"
  | "projetos_search"
  | "conecta_stats"
  | "systems_list"
  | "systems_search"
  | "about_secti"
  | "about_hub"
  | "territorios"
  | "noticias"
  | "greeting"
  | "thanks"
  | "help"
  | "unknown"

export interface IntentResult {
  intent: Intent
  confidence: number
  entities: string[]
}

const INTENT_PATTERNS: Record<Intent, string[]> = {
  projetos_stats: [
    "quantos projeto", "quantas projeto", "total projeto", "numero projeto",
    "status projeto", "andamento projeto", "execucao projeto", "projeto concluido",
    "projeto executado", "quantidade projeto",
  ],
  projetos_search: [
    "buscar projeto", "pesquisar projeto", "encontrar projeto", "procurar projeto",
    "projeto sobre", "projetos de", "lista projeto", "listar projeto",
    "quais projeto", "tem projeto", "existe projeto",
  ],
  conecta_stats: [
    "conecta bahia", "conectividade", "pracas instaladas", "internet gratuita",
    "municipios conectados", "municipios com internet", "cobertura conecta",
    "pontos conecta",
  ],
  systems_list: [
    "sistemas disponiveis", "quais sistemas", "lista sistemas", "quantos sistemas",
    "plataformas", "ferramentas",
  ],
  systems_search: [
    "buscar sistema", "encontrar sistema", "procurar sistema", "sistema para",
    "sistema de gestao", "sistema de dados", "sistema de pesquisa", "sistema de comunicacao",
  ],
  about_secti: [
    "secti", "secretaria", "ciencia tecnologia", "inovacao bahia",
    "sobre secti", "o que e secti", "missao secti",
  ],
  about_hub: [
    "hub secti", "o que e hub", "plataforma central", "portal integrado",
    "sistemas integrados", "como funciona", "navegar",
  ],
  territorios: [
    "territorios", "territorio", "municipios bahia", "regioes bahia",
    "cidades bahia", "divisao territorial",
  ],
  noticias: [
    "noticias", "novidades", "atualizacoes", "timeline", "ultimas noticias",
  ],
  greeting: [
    "ola", "oi", "bom dia", "boa tarde", "boa noite", "ola tudo bem", "hello",
  ],
  thanks: [
    "obrigado", "obrigada", "valeu", "agradeco", "muito obrigado", "muito obrigada",
    "obrigado pela ajuda",
  ],
  help: [
    "ajuda", "socorro", "como usar", "o que posso perguntar", "menu",
    "opcoes", "topicos",
  ],
  unknown: [],
}

export function detectIntent(query: string): IntentResult {
  const text = query.toLowerCase().trim()
  const tokens = tokenize(query)
  const filtered = removeStopwords(tokens)
  const stems = stemTokens(filtered.length > 0 ? filtered : tokens)

  const scores: { intent: Intent; score: number; entities: string[] }[] = []

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS) as [Intent, string[]][]) {
    if (patterns.length === 0) continue

    let maxScore = 0
    const matchedEntities: string[] = []

    for (const pattern of patterns) {
      const patternTokens = tokenize(pattern)
      const patternStems = stemTokens(patternTokens)
      let matchScore = 0

      if (text.includes(pattern)) matchScore += 5

      for (let i = 0; i < patternStems.length; i++) {
        if (stems.includes(patternStems[i])) matchScore += 2
      }

      const stemOverlap = patternStems.filter((ps) => stems.some((s) => similarity(s, ps) > 0.85)).length
      matchScore += stemOverlap

      if (matchScore > maxScore) maxScore = matchScore
      if (stemOverlap > 0 && !matchedEntities.includes(pattern)) matchedEntities.push(pattern)
    }

    if (maxScore > 0) {
      scores.push({ intent, score: maxScore, entities: matchedEntities })
    }
  }

  if (scores.length === 0) return { intent: "unknown", confidence: 0, entities: [] }

  scores.sort((a, b) => b.score - a.score)
  const best = scores[0]
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0)
  const confidence = totalScore > 0 ? best.score / totalScore : 0

  return {
    intent: best.intent,
    confidence: Math.min(confidence, 1),
    entities: best.entities,
  }
}
