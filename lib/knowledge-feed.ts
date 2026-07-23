import type { KnowledgeEntry } from "./chatbot-knowledge"
import { allEntries as staticEntries } from "./chatbot-knowledge"
import territoriosData from "./territorioMunicipios.json"

const FEED_INTERVAL_MS = 5 * 60 * 1000
const FEED_KEY = "chatbot-knowledge-feed-v1"

type FeedSnapshot = {
  fetchedAt: number
  entries: KnowledgeEntry[]
}

let liveEntries: KnowledgeEntry[] = []
let feedTimer: ReturnType<typeof setInterval> | null = null
let initialized = false
const listeners = new Set<(entries: KnowledgeEntry[]) => void>()

function notifyListeners() {
  const all = [...staticEntries, ...liveEntries]
  for (const l of listeners) l(all)
  try {
    sessionStorage.setItem(FEED_KEY, JSON.stringify({ fetchedAt: Date.now(), entries: liveEntries } satisfies FeedSnapshot))
  } catch {}
}

function entryFromNoticia(n: { title?: string; description?: string; date?: string; href?: string }, index: number): KnowledgeEntry | null {
  if (!n.title) return null
  return {
    id: `noticia-${index}-${Date.now().toString(36)}`,
    keywords: [n.title.toLowerCase().slice(0, 60), "noticia secti", "novidade secti", "portal secti", `noticia ${n.date ?? ""}`.trim()].filter(Boolean),
    title: n.title,
    content: `Notícia do Portal SECTI (${n.date ?? "data indisponível"}):\n\n${n.description ?? n.title}\n${n.href ? `\nLeia na íntegra em ba.gov.br${n.href}` : ""}`.trim(),
    category: "noticias",
    links: n.href ? [{ label: "Ler notícia", url: `https://www.ba.gov.br${n.href}` }] : undefined,
  }
}

function entryFromProjeto(p: { titulo?: string; natureza?: string; status?: string; instituicao?: string; responsavel?: string; objetivoGeral?: string; periodo?: string }, index: number): KnowledgeEntry | null {
  if (!p.titulo) return null
  const alvo = [p.natureza, p.instituicao, p.responsavel, p.objetivoGeral].filter(Boolean).join(" ").toLowerCase()
  return {
    id: `projeto-cadastrado-${index}-${Date.now().toString(36)}`,
    keywords: [p.titulo.toLowerCase(), "projeto cadastrado", "projeto secti", p.natureza ?? "", p.instituicao ?? "", p.responsavel ?? ""].filter(Boolean),
    title: p.titulo,
    content: `Projeto cadastrado no Hub:\n\nTítulo: ${p.titulo}\nNatureza: ${p.natureza ?? "—"}\nStatus: ${p.status ?? "—"}\nInstituição: ${p.instituicao ?? "—"}\nResponsável: ${p.responsavel ?? "—"}\nPeríodo: ${p.periodo ?? "—"}\n\nObjetivo: ${p.objetivoGeral ?? "—"}`.trim(),
    category: "projetos-feed",
  }
}

function territorioEntries(): KnowledgeEntry[] {
  const out: KnowledgeEntry[] = []
  const ts = (territoriosData as { territorios_de_identidade: Array<{ id: number; nome: string; quantidade_municipios: number; municipios: string[] }> }).territorios_de_identidade
  for (const t of ts) {
    out.push({
      id: `territorio-${t.id}`,
      keywords: [t.nome.toLowerCase(), "territorio bahia", "municipios territorio", `territorio ${t.id}`, ...t.municipios.map((m) => m.toLowerCase())].slice(0, 24),
      title: `Território ${t.nome}`,
      content: `Território de Identidade ${t.nome} (nº ${t.id}) — ${t.quantidade_municipios} municípios: ${t.municipios.join(", ")}.`,
      category: "territorios",
      links: [{ label: "Ver territórios", url: "#sobre" }],
    })
  }
  return out
}

async function fetchLiveEntries(): Promise<KnowledgeEntry[]> {
  const out: KnowledgeEntry[] = []

  const noticiasRes = await fetch("/api/hub/noticias", { headers: { Accept: "application/json" } })
  if (noticiasRes.ok) {
    const data = await noticiasRes.json() as { items?: Array<{ title?: string; description?: string; date?: string; href?: string }> }
    const items = data.items ?? []
    items.slice(0, 8).forEach((n, i) => {
      const e = entryFromNoticia(n, i)
      if (e) out.push(e)
    })
  }

  const projetosRes = await fetch("/api/hub/projetos?limit=20&offset=0", { headers: { Accept: "application/json" } })
  if (projetosRes.ok) {
    const data = await projetosRes.json() as { projetos?: Array<{ titulo?: string; natureza?: string; status?: string; instituicao?: string; responsavel?: string; objetivoGeral?: string; periodo?: string }> }
    const projetos = data.projetos ?? []
    projetos.slice(0, 12).forEach((p, i) => {
      const e = entryFromProjeto(p, i)
      if (e) out.push(e)
    })
  }

  const conectaRes = await fetch("/api/hub/conecta-resumo", { headers: { Accept: "application/json" } })
  if (conectaRes.ok) {
    const data = await conectaRes.json() as { summary?: { municipalitiesCount?: number; territoriesCount?: number; installedPointsCount?: number } }
    if (data.summary) {
      const { municipalitiesCount, territoriesCount, installedPointsCount } = data.summary
      out.push({
        id: "conecta-feed",
        keywords: ["conecta bahia", "conectividade", "internet bahia", "pracas instaladas", "municipios conectados", "cobertura conecta"],
        title: "Conecta Bahia (ao vivo)",
        content: `Cobertura atual do Conecta Bahia: ${municipalitiesCount ?? "..."} municípios, ${territoriesCount ?? "..."} territórios, ${installedPointsCount ?? "..."} praças instaladas. Dados consultados da API do Conecta.`,
        category: "conecta",
        links: [{ label: "Painel Conecta Bahia", url: "https://conectabahia.secti.ba.gov.br" }],
      })
    }
  }

  return out
}

async function refreshFeed(): Promise<void> {
  try {
    const fresh = await fetchLiveEntries()
    if (fresh.length > 0) {
      liveEntries = fresh
      notifyListeners()
    }
  } catch {
    // silencioso: mantém entradas anteriores
  }
}

export function startKnowledgeFeed(): void {
  if (initialized) return
  initialized = true

  try {
    const cached = sessionStorage.getItem(FEED_KEY)
    if (cached) {
      const snap = JSON.parse(cached) as FeedSnapshot
      if (Date.now() - snap.fetchedAt < FEED_INTERVAL_MS && snap.entries.length > 0) {
        liveEntries = snap.entries
      }
    }
  } catch {}

  refreshFeed()
  feedTimer = setInterval(refreshFeed, FEED_INTERVAL_MS)
}

export function stopKnowledgeFeed(): void {
  if (feedTimer) clearTimeout(feedTimer)
  feedTimer = null
  initialized = false
}

export function getExtendedKnowledge(): KnowledgeEntry[] {
  return [...staticEntries, ...territorioEntries(), ...liveEntries]
}

export function subscribeKnowledgeFeed(cb: (entries: KnowledgeEntry[]) => void): () => void {
  listeners.add(cb)
  cb(getExtendedKnowledge())
  return () => { listeners.delete(cb) }
}

export function getFeedStatus(): { lastFetch: number | null; entryCount: number } {
  try {
    const cached = sessionStorage.getItem(FEED_KEY)
    if (cached) return { lastFetch: (JSON.parse(cached) as FeedSnapshot).fetchedAt, entryCount: liveEntries.length }
  } catch {}
  return { lastFetch: null, entryCount: liveEntries.length }
}
