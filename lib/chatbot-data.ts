import { getCached, setCache } from "./cache-db"
import { detectIntent, extractSearchTerms, type Intent } from "./nlu"

const PROJETOS_STATS_KEY = "chatbot-projetos-stats-v1"
const CONECTA_STATS_KEY = "chatbot-conecta-stats-v1"
const NOTICIAS_KEY = "chatbot-noticias-v1"

type ProjetoBasico = {
  id: string
  titulo?: string
  natureza?: string
  status?: string
  estadoAtual?: string
  instituicao?: string
  responsavel?: string
  periodo?: string
  investimentoReal?: string
  objetivoGeral?: string
}

type ProjetosApiResponse = {
  total: number
  projetos: ProjetoBasico[]
} | { error: string }

type ConectaApiResponse = {
  summary?: {
    municipalitiesCount?: number
    territoriesCount?: number
    installedPointsCount?: number
  }
} | { error: string }

type Noticia = {
  date?: string
  title?: string
  description?: string
  href?: string
}

type NoticiasApiResponse = {
  source?: string
  fetchedAt?: string
  items?: Noticia[]
} | { error: string }

async function apiFetch<T>(url: string, cacheKey: string, baseUrl?: string): Promise<T> {
  try {
    const absUrl = baseUrl && url.startsWith("/") ? `${baseUrl}${url}` : url
    const res = await fetch(absUrl, { headers: { Accept: "application/json" } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as T

    if (typeof data === "object" && data !== null && "error" in data) {
      throw new Error((data as { error: string }).error)
    }

    setCache(cacheKey, data).catch(() => {})
    return data
  } catch (apiErr) {
    const cached = await getCached<T>(cacheKey)
    if (cached) return cached.data
    throw apiErr
  }
}

export async function fetchProjetosStats(baseUrl?: string): Promise<{ content: string } | null> {
  try {
    const data = await apiFetch<ProjetosApiResponse>(
      "/api/hub/projetos?limit=50&offset=0",
      PROJETOS_STATS_KEY,
      baseUrl
    )

    if ("error" in data) return null
    if (data.total === 0) return null

    const statusCount: Record<string, number> = {}
    for (const p of data.projetos) {
      const s = p.status || "Sem status"
      statusCount[s] = (statusCount[s] || 0) + 1
    }

    const statusLines = Object.entries(statusCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([s, c]) => `  • ${s}: ${c} projeto${c > 1 ? "s" : ""}`)
      .join("\n")

    return {
      content: `Atualmente temos **${data.total} projetos** cadastrados no Hub SECTI.\n\nDistribuição por status:\n${statusLines}\n\nDados carregados ao vivo do Firebase.`,
    }
  } catch {
    return null
  }
}

export async function fetchProjetosSearch(query: string, baseUrl?: string): Promise<{ content: string } | null> {
  try {
    const params = new URLSearchParams({ limit: "20", offset: "0", search: query, nocache: "true" })
    const data = await apiFetch<ProjetosApiResponse>(
      `/api/hub/projetos?${params}`,
      `chatbot-projetos-search-${encodeURIComponent(query).slice(0, 32)}`,
      baseUrl
    )

    if ("error" in data) return null
    if (data.total === 0) return null

    const projetos = data.projetos.slice(0, 5)

    if (data.total === 1) {
      const p = projetos[0]
      const investimento = p.investimentoReal ? `\nInvestimento: ${p.investimentoReal}` : ""
      const periodo = p.periodo ? `\nPeríodo: ${p.periodo}` : ""
      return {
        content: `Encontrei 1 projeto:\n\n**${p.titulo}**\nNatureza: ${p.natureza || "—"}\nStatus: ${p.status || "—"}${p.estadoAtual ? ` (${p.estadoAtual})` : ""}\nInstituição: ${p.instituicao || "—"}\nResponsável: ${p.responsavel || "—"}${periodo}${investimento}\n\n${p.objetivoGeral || ""}`.trim(),
      }
    }

    const lista = projetos
      .map((p, i) => `${i + 1}. **${p.titulo}** — ${p.status || "—"} (${p.instituicao || "—"})`)
      .join("\n")

    return {
      content: `Encontrei **${data.total} projeto${data.total > 1 ? "s" : ""}**. Aqui estão ${projetos.length === data.total ? "todos" : `os ${projetos.length} mais relevantes`}:\n\n${lista}\n\nUse a seção Projetos do Hub para ver todos os detalhes.`,
    }
  } catch {
    return null
  }
}

export async function fetchConectaStats(baseUrl?: string): Promise<{ content: string } | null> {
  try {
    const data = await apiFetch<ConectaApiResponse>(
      "/api/hub/conecta-resumo?nocache=true",
      CONECTA_STATS_KEY,
      baseUrl
    )

    if ("error" in data) return null
    if (!data?.summary) return null

    const { municipalitiesCount, territoriesCount, installedPointsCount } = data.summary

    return {
      content: `Dados atualizados do *Conecta Bahia*:\n\n  • *${municipalitiesCount ?? "..."} municípios** com conectividade\n  • **${territoriesCount ?? "..."} territórios** de identidade cobertos\n  • **${installedPointsCount ?? "..."} praças** instaladas e ativas\n\nO Conecta Bahia é o programa estadual que leva internet gratuita a praças e espaços públicos nos municípios baianos.\n\nDados consultados ao vivo.`,
    }
  } catch {
    return null
  }
}

export async function fetchNoticias(baseUrl?: string): Promise<{ content: string; links: { label: string; url: string }[] } | null> {
  try {
    const data = await apiFetch<NoticiasApiResponse>("/api/hub/noticias", NOTICIAS_KEY, baseUrl)

    if ("error" in data) return null
    if (!data?.items || data.items.length === 0) return null

    const top3 = data.items.slice(0, 3)
    const lista = top3
      .map((n, i) => `${i + 1}. **${n.title || "Sem título"}** ${n.date ? `(${n.date})` : ""}\n   ${n.description?.slice(0, 120) || ""}...`)
      .join("\n\n")

    const links = top3
      .filter((n) => n.href)
      .map((n) => ({ label: n.title?.slice(0, 30) || "Notícia", url: `https://www.ba.gov.br${n.href}` }))

    return {
      content: `Últimas notícias do Portal SECTI:\n\n${lista}\n\nConsulte mais notícias no portal oficial.`,
      links,
    }
  } catch {
    return null
  }
}

export interface LiveDataIntent {
  projetos?: "stats" | "search"
  conecta?: boolean
  noticias?: boolean
  searchTerms?: string
  intent: Intent
}

export function detectLiveIntent(query: string): LiveDataIntent {
  const intentResult = detectIntent(query)

  const result: LiveDataIntent = { intent: intentResult.intent }

  if (intentResult.intent === "projetos_stats") result.projetos = "stats"
  else if (intentResult.intent === "projetos_search") {
    result.projetos = "search"
    result.searchTerms = extractSearchTerms(query, intentResult.intent)
  }

  if (intentResult.intent === "conecta_stats") result.conecta = true
  if (intentResult.intent === "noticias") result.noticias = true

  if (!result.projetos && !result.conecta && !result.noticias) {
    const q = query.toLowerCase()
    if (/\b(projeto|projetos)\b/i.test(q)) result.projetos = "stats"
  }

  return result
}
