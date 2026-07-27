import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { SystemsSection } from "@/components/systems-section"
import { AboutSection } from "@/components/about-section"
import { SectiTimelineSection } from "@/components/secti-timeline-section"
import { ProjetosSection } from "@/components/projetos-section"
import { Footer } from "@/components/footer"
import { BackToTop } from "@/components/back-to-top"
import { PageAccessLogger } from "@/components/page-access-logger"
import { Chatbot } from "@/components/chatbot"
import { MapaSection } from "@/components/mapa-section"
import { agregarMetricasTerritorios } from "@/lib/agregar-metricas"
import type { MetricasExternas } from "@/lib/agregar-metricas"
import { simplifyMunicipioName, isInstalledStatus } from "@/lib/conecta-coverage"
import { CONECTA_REFERENCE_TOTALS } from "@/lib/conecta-reference"
import territoriosData from "@/lib/territorioMunicipios.json"
import type { ConectaPoint } from "@/lib/conecta-coverage"
import { getServerCache, setServerCache } from "@/lib/server-cache"

const normalize = (s: string): string =>
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, "").trim()

const MUNICIPIO_TERRITORIO_MAP = new Map<string, string>()
const TERRITORIO_NORMALIZE_MAP = new Map<string, string>()
for (const t of territoriosData.territorios_de_identidade) {
  const tn = normalize(t.nome)
  TERRITORIO_NORMALIZE_MAP.set(tn, t.nome)
  for (const m of t.municipios) {
    MUNICIPIO_TERRITORIO_MAP.set(simplifyMunicipioName(m), tn)
  }
}

const CONECTA_API = process.env.CONECTA_API_URL || "https://sharepoint-conecta.obitoandradeuthiha.workers.dev"
const PROJETOS_API = process.env.PROJETOS_API_URL || "https://projetos-secti.obitoandradeuthiha.workers.dev"
const METRICAS_CACHE_KEY = "metricas-externas-v1"
const METRICAS_CACHE_TTL = 5 * 60 * 1000

async function fetchMetricasExternas(): Promise<MetricasExternas | undefined> {
  const cached = getServerCache<MetricasExternas>(METRICAS_CACHE_KEY, METRICAS_CACHE_TTL)
  if (cached) return cached

  const metricas: MetricasExternas = {}

  try {
    const projRes = await fetch(PROJETOS_API, { signal: AbortSignal.timeout(8000) })
    if (projRes.ok) {
      const projData = await projRes.json() as { projetos?: unknown[] }
      if (projData.projetos?.length) {
        Object.assign(metricas, agregarMetricasTerritorios(projData.projetos))
      }
    }
  } catch { /* fallback */ }

  try {
    const conectaRes = await fetch(CONECTA_API, { signal: AbortSignal.timeout(8000) })
    if (conectaRes.ok) {
      const body = await conectaRes.json() as Record<string, unknown> | string
      const conectaRaw = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown[] | undefined>

      const terrConecta = new Map<string, { municipiosConectados: number; installedPoints: number }>()

      for (const [municipio, pracas] of Object.entries(conectaRaw)) {
        const rows = Array.isArray(pracas) ? (pracas as ConectaPoint[]) : []
        const installedRows = rows.filter((r) => !r || isInstalledStatus(r?.status_instalacao))
        if (installedRows.length === 0) continue

        const normMun = simplifyMunicipioName(municipio)
        if (!normMun) continue

        const tn = MUNICIPIO_TERRITORIO_MAP.get(normMun)
        if (!tn) continue

        if (!terrConecta.has(tn)) terrConecta.set(tn, { municipiosConectados: 0, installedPoints: 0 })
        const entry = terrConecta.get(tn)!
        entry.municipiosConectados++
        entry.installedPoints += installedRows.length
      }

      for (const [tn, vals] of terrConecta) {
        if (!metricas[tn]) metricas[tn] = {}
        metricas[tn].municipiosConectados = vals.municipiosConectados
        metricas[tn].installedPoints = vals.installedPoints
      }
    }
  } catch { /* fallback */ }

  const totalMunicipiosBahia = territoriosData.territorios_de_identidade.reduce(
    (sum, t) => sum + (t.quantidade_municipios || t.municipios.length), 0
  )

  if (Object.keys(metricas).length > 0) {
    const lastCached = getServerCache<MetricasExternas>(METRICAS_CACHE_KEY, 24 * 60 * 60 * 1000)
    if (lastCached) {
      for (const [tn, vals] of Object.entries(lastCached)) {
        if (vals.municipiosConectados || vals.installedPoints) {
          if (!metricas[tn]) metricas[tn] = {}
          metricas[tn].municipiosConectados ??= vals.municipiosConectados
          metricas[tn].installedPoints ??= vals.installedPoints
        }
      }
    }

    for (const tn of Object.keys(metricas)) {
      if (metricas[tn].municipiosConectados === undefined) {
        const tOrig = territoriosData.territorios_de_identidade.find(
          (t) => normalize(t.nome) === tn
        )
        const munCount = tOrig?.quantidade_municipios || tOrig?.municipios.length || 1
        const ratio = totalMunicipiosBahia > 0 ? munCount / totalMunicipiosBahia : 0
        metricas[tn].municipiosConectados = Math.max(1, Math.round(CONECTA_REFERENCE_TOTALS.municipalitiesCount * ratio))
        metricas[tn].installedPoints = Math.max(0, Math.round(CONECTA_REFERENCE_TOTALS.installedPointsCount * ratio))
      }
    }
  }

  const result = Object.keys(metricas).length > 0 ? metricas : undefined
  if (result) setServerCache(METRICAS_CACHE_KEY, result, METRICAS_CACHE_TTL)
  return result
}

export default async function Home() {
  const metricasExternas = await fetchMetricasExternas()

  return (
    <main className="min-h-screen">
      <PageAccessLogger />
      <Header />
      <Hero />
      <SystemsSection />
      <MapaSection metricasExternas={metricasExternas} />
      <ProjetosSection />
      <AboutSection />
      <SectiTimelineSection />
      <Footer />
      <BackToTop />
      <Chatbot />
    </main>
  )
}
