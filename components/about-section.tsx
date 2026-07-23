"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Lightbulb, Users, Rocket, Target, Zap, Globe, ArrowRight, Building2, GraduationCap, FlaskConical, Microscope, Layers, Factory, Briefcase } from "lucide-react"
import { useLocalLLMMode } from "@/lib/local-llm-context"
import Link from "next/link"
import { CONECTA_REFERENCE_TOTALS } from "@/lib/conecta-reference"
import { buildImageProxyPath } from "@/lib/image-proxy"
import { useLogAccess } from "@/hooks/use-log-access"
import { saveChatSnapshot } from "@/lib/chat-store"

const colors = {
  green: "#7AC143",
  cyan: "#00B5AD",
  orange: "#F7941D",
  blue: "#0077C0",
  red: "#ED1C24",
  magenta: "#EC008C",
  yellow: "#FDB913",
}

type StatItem = {
  value: number
  suffix?: string
  label: string
  color: string
}

type EntityBreakdown = {
  universidades: number
  univsPublica: number
  univsPrivada: number
  institutosFederais: number
  icts: number
  centrosPesquisa: number
  espacosDinamizadores: number
  parquesTecnologicos: number
  incubadoras: number
}

type TerritoryCapacity = {
  entidadesTotal?: number
  universidades?: number
  univsPublica?: number
  univsPrivada?: number
  campiUniversitarios?: number
  campiIFs?: number
  icts?: number
  centrosPesquisa?: number
  espacosDinamizadores?: number
  parquesTecnologicos?: number
  incubadoras?: number
}

type TerritorialApiResponse = {
  summary?: {
    territories?: number
    totalEntidades?: number
  }
  territories?: Array<{
    territory?: string
    capacidade?: TerritoryCapacity
    assistenciaPublica?: {
      existe?: boolean
    }
    cadeiasProdutivasDetalhado?: Array<unknown>
    cursosDetalhado?: Array<unknown>
    desenvolvimento?: {
      ifdmTi?: number
      populacaoTotal?: number
    }
  }>
}

type ConectaCoverageStats = {
  territoriesCount: number
  municipalitiesCount: number
  installedPointsCount: number
}

type ConectaSummaryApiResponse = {
  summary?: {
    territoriesCount?: number
    municipalitiesCount?: number
    installedPointsCount?: number
  }
}

type CachedAboutStats = {
  totalEntidades: number
  assistenciaTerritorios: number
  entityBreakdown: EntityBreakdown
  totalApls: number
  totalCursos: number
  ifdmMedio: number
  territoriesConecta?: number
  municipalitiesConecta?: number
  installedPointsConecta?: number
}

type AboutNewsApiResponse = {
  items?: Array<{
    preview?: {
      image?: string
    }
  }>
}

const ABOUT_CACHE_KEY = "hub_about_stats_cache_v2"
const DEFAULT_ENTIDADES_FALLBACK = 500
const ENTITY_BREAKDOWN_LABELS: { key: keyof EntityBreakdown; label: string; icon: typeof Building2; color: string }[] = [
  { key: "univsPublica", label: "Univ. Pública", icon: Building2, color: colors.blue },
  { key: "univsPrivada", label: "Univ. Privada", icon: Building2, color: colors.cyan },
  { key: "institutosFederais", label: "Institutos Federais", icon: GraduationCap, color: colors.red },
  { key: "icts", label: "ICTs", icon: FlaskConical, color: colors.cyan },
  { key: "centrosPesquisa", label: "Centros de Pesquisa", icon: Microscope, color: colors.green },
  { key: "espacosDinamizadores", label: "Espaços Dinamizadores", icon: Layers, color: colors.orange },
  { key: "parquesTecnologicos", label: "Parques Tecnológicos", icon: Factory, color: colors.magenta },
  { key: "incubadoras", label: "Incubadoras", icon: Briefcase, color: colors.yellow },
]
const DEFAULT_ENTITY_BREAKDOWN: EntityBreakdown = {
  universidades: 0,
  univsPublica: 0,
  univsPrivada: 0,
  institutosFederais: 0,
  icts: 0,
  centrosPesquisa: 0,
  espacosDinamizadores: 0,
  parquesTecnologicos: 0,
  incubadoras: 0,
}
const ABOUT_NEWS_LIMIT = 6
const ABOUT_NEWS_BACKGROUND_SLOTS = 6
const ABOUT_STATS_REFRESH_INTERVAL_MS = 60 * 1000
const DEFAULT_CONECTA_STATS: ConectaCoverageStats = {
  territoriesCount: CONECTA_REFERENCE_TOTALS.territoriesCount,
  municipalitiesCount: CONECTA_REFERENCE_TOTALS.municipalitiesCount,
  installedPointsCount: CONECTA_REFERENCE_TOTALS.installedPointsCount,
}
const DEFAULT_NEWS_IMAGE =
  "https://www.ba.gov.br/secti/modules/custom/bagov_base_blocks/assets/images/logo-governo-rodape.png"

function mergeConectaStats(current: ConectaCoverageStats, fallback: ConectaCoverageStats): ConectaCoverageStats {
  return {
    territoriesCount: current.territoriesCount > 0 ? current.territoriesCount : fallback.territoriesCount,
    municipalitiesCount: current.municipalitiesCount > 0 ? current.municipalitiesCount : fallback.municipalitiesCount,
    installedPointsCount: current.installedPointsCount > 0 ? current.installedPointsCount : fallback.installedPointsCount,
  }
}

function getConectaStatsFromCache(stats?: CachedAboutStats | null): ConectaCoverageStats {
  return mergeConectaStats(
    {
      territoriesCount: Number(stats?.territoriesConecta || 0),
      municipalitiesCount: Number(stats?.municipalitiesConecta || 0),
      installedPointsCount: Number(stats?.installedPointsConecta || 0),
    },
    DEFAULT_CONECTA_STATS,
  )
}

function normalizeNewsImageUrl(rawUrl: string) {
  const trimmed = rawUrl.trim()

  if (!trimmed) {
    return DEFAULT_NEWS_IMAGE
  }

  let candidate = trimmed

  if (candidate.startsWith("//")) {
    candidate = `https:${candidate}`
  } else if (candidate.startsWith("/")) {
    candidate = `https://www.ba.gov.br${candidate}`
  }

  try {
    const parsed = new URL(candidate)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return DEFAULT_NEWS_IMAGE
    }

    parsed.protocol = "https:"
    return parsed.toString()
  } catch {
    return DEFAULT_NEWS_IMAGE
  }
}

function buildNewsImageProxyUrl(rawUrl: string) {
  return buildImageProxyPath(normalizeNewsImageUrl(rawUrl))
}

function fillBackgroundSlots(images: string[]) {
  if (images.length === 0) {
    return []
  }

  const filled: string[] = []

  for (let index = 0; index < ABOUT_NEWS_BACKGROUND_SLOTS; index += 1) {
    filled.push(images[index % images.length])
  }

  return filled
}

function readCachedAboutStats(): CachedAboutStats | null {
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(ABOUT_CACHE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<CachedAboutStats>

    if (typeof parsed.totalEntidades !== "number" || parsed.totalEntidades <= 0) {
      return null
    }

    return {
      totalEntidades: parsed.totalEntidades,
      assistenciaTerritorios: typeof parsed.assistenciaTerritorios === "number" ? parsed.assistenciaTerritorios : 0,
      entityBreakdown: parsed.entityBreakdown ?? DEFAULT_ENTITY_BREAKDOWN,
      totalApls: typeof parsed.totalApls === "number" ? parsed.totalApls : 0,
      totalCursos: typeof parsed.totalCursos === "number" ? parsed.totalCursos : 0,
      ifdmMedio: typeof parsed.ifdmMedio === "number" ? parsed.ifdmMedio : 0,
      territoriesConecta: typeof parsed.territoriesConecta === "number" ? parsed.territoriesConecta : undefined,
      municipalitiesConecta: typeof parsed.municipalitiesConecta === "number" ? parsed.municipalitiesConecta : undefined,
      installedPointsConecta: typeof parsed.installedPointsConecta === "number" ? parsed.installedPointsConecta : undefined,
    }
  } catch {
    return null
  }
}

function saveCachedAboutStats(stats: CachedAboutStats) {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(ABOUT_CACHE_KEY, JSON.stringify(stats))
  } catch {
    // Ignora erro de persistencia em navegadores com storage bloqueado.
  }
}

function buildStats(totalEntidades: number, conectaStats: ConectaCoverageStats): StatItem[] {
  return [
    { value: conectaStats.territoriesCount, suffix: "", label: "Territórios Conecta", color: colors.cyan },
    { value: conectaStats.municipalitiesCount, suffix: "", label: "Municípios Conecta", color: colors.green },
    { value: totalEntidades, suffix: "", label: "Entidades Mapeadas", color: colors.orange },
    { value: conectaStats.installedPointsCount, suffix: "", label: "Praças Instaladas", color: colors.magenta },
  ]
}

const defaultStats = buildStats(DEFAULT_ENTIDADES_FALLBACK, DEFAULT_CONECTA_STATS)

const values = [
  {
    icon: Lightbulb,
    title: "Inovação",
    description: "Impulsionando o avanço tecnológico e científico em todo o estado",
    color: colors.orange,
  },
  {
    icon: Users,
    title: "Inclusão Digital",
    description: "Democratizando o acesso ao conhecimento e as ferramentas digitais",
    color: colors.cyan,
  },
  {
    icon: Rocket,
    title: "Desenvolvimento",
    description: "Fomentando o crescimento econômico sustentável e a geração de empregos",
    color: colors.magenta,
  },
  {
    icon: Target,
    title: "Transparência",
    description: "Dados abertos e gestão pública acessível para todos os cidadãos",
    color: colors.green,
  },
  {
    icon: Zap,
    title: "Eficiência",
    description: "Otimizando processos e recursos para melhor atender a população",
    color: colors.yellow,
  },
  {
    icon: Globe,
    title: "Conectividade",
    description: "Integrando sistemas e pessoas em toda a extensão do território baiano",
    color: colors.blue,
  },
]

function AnimatedCounter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)
  const { useLocal } = useLocalLLMMode()

  useEffect(() => {
    if (useLocal || hasAnimated) {
      setCount(end)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          let start = 0
          const duration = 2000
          const increment = end / (duration / 16)

          const timer = setInterval(() => {
            start += increment
            if (start >= end) {
              setCount(end)
              clearInterval(timer)
            } else {
              setCount(Math.floor(start))
            }
          }, 16)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, hasAnimated, useLocal])

  return (
    <div ref={ref} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </div>
  )
}

function FloatingShape({ color, size, top, left, delay }: { 
  color: string
  size: number
  top: string
  left: string
  delay: number 
}) {
  return (
  <></>
  )
}

export function AboutSection() {
  useLogAccess("/sobre")

  const initialCachedStats = readCachedAboutStats()
  const initialCachedConectaStats = getConectaStatsFromCache(initialCachedStats)
  const [hoveredStat, setHoveredStat] = useState<number | null>(null)
  const [newsBackgroundImages, setNewsBackgroundImages] = useState<string[]>([])
  const [liveStats, setLiveStats] = useState<StatItem[]>(() =>
    buildStats(initialCachedStats?.totalEntidades ?? DEFAULT_ENTIDADES_FALLBACK, initialCachedConectaStats),
  )
  const [dataStatus, setDataStatus] = useState<"loading" | "ready" | "cached" | "error">(
    initialCachedStats ? "cached" : "loading",
  )
  const [assistenciaTerritorios, setAssistenciaTerritorios] = useState(initialCachedStats?.assistenciaTerritorios ?? 0)
  const [entityBreakdown, setEntityBreakdown] = useState<EntityBreakdown>(
    initialCachedStats?.entityBreakdown ?? DEFAULT_ENTITY_BREAKDOWN,
  )
  const [totalApls, setTotalApls] = useState(initialCachedStats?.totalApls ?? 0)
  const [totalCursos, setTotalCursos] = useState(initialCachedStats?.totalCursos ?? 0)
  const [ifdmMedio, setIfdmMedio] = useState(initialCachedStats?.ifdmMedio ?? 0)
  const [totalEntidades, setTotalEntidades] = useState(initialCachedStats?.totalEntidades ?? DEFAULT_ENTIDADES_FALLBACK)
  const [showEntityBreakdown, setShowEntityBreakdown] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    let active = true
    let refreshTimer: ReturnType<typeof setTimeout> | null = null
    let isFetching = false

    const scheduleNextRefresh = () => {
      if (!active) {
        return
      }

      refreshTimer = setTimeout(() => {
        void loadStatsFromSources()
      }, ABOUT_STATS_REFRESH_INTERVAL_MS)
    }

    const loadStatsFromSources = async () => {
      if (isFetching || !active) {
        return
      }

      isFetching = true

      try {
        const requestTimestamp = Date.now()
        const [territoriosFetch, conectaFetch] = await Promise.allSettled([
          fetch(`/api/hub/territorios?nocache=true&ts=${requestTimestamp}`, {
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          }),
          fetch(`/api/hub/conecta-resumo?nocache=true&ts=${requestTimestamp}`, {
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          }),
        ])

        if (territoriosFetch.status === "rejected") {
          throw new Error("Falha ao carregar dados de SECTI Territorios.")
        }

        const territoriosRes = territoriosFetch.value
        if (!territoriosRes.ok) {
          throw new Error(`Falha ao carregar dados de SECTI Territorios (HTTP ${territoriosRes.status}).`)
        }

        const territoriosData = (await territoriosRes.json()) as TerritorialApiResponse
        const cachedStatsSnapshot = readCachedAboutStats() ?? initialCachedStats
        const conectaFallbackStats = getConectaStatsFromCache(cachedStatsSnapshot)
        let conectaStats = conectaFallbackStats

        if (conectaFetch.status === "fulfilled") {
          if (conectaFetch.value.ok) {
            const conectaData = (await conectaFetch.value.json()) as ConectaSummaryApiResponse
            const summary = conectaData.summary
            const conectaCoverage: ConectaCoverageStats = {
              territoriesCount: Number(summary?.territoriesCount || 0),
              municipalitiesCount: Number(summary?.municipalitiesCount || 0),
              installedPointsCount: Number(summary?.installedPointsCount || 0),
            }

            conectaStats = mergeConectaStats(conectaCoverage, conectaFallbackStats)
          } else {
            console.warn(`[AboutSection] Falha ao carregar Conecta Bahia (HTTP ${conectaFetch.value.status}).`)
          }
        } else {
          console.warn("[AboutSection] Erro ao buscar Conecta Bahia:", conectaFetch.reason)
        }

        if (!active) return

        const territories = territoriosData.territories || []

        const totalEntidadesRaw =
          territoriosData.summary?.totalEntidades ||
          territories.reduce((sum, item) => sum + Number(item?.capacidade?.entidadesTotal || 0), 0)
        const totalEntidades = totalEntidadesRaw > 0
          ? totalEntidadesRaw
          : cachedStatsSnapshot?.totalEntidades || DEFAULT_ENTIDADES_FALLBACK
        const totalAssistencia = territories.filter(
          (item) => item?.assistenciaPublica?.existe,
        ).length

        const breakdown: EntityBreakdown = { ...DEFAULT_ENTITY_BREAKDOWN }
        let totalAplsCount = 0
        let totalCursosCount = 0
        let ifdmWeightedSum = 0
        let ifdmPopSum = 0

        territories.forEach((item) => {
          const cap = item.capacidade
          if (cap) {
            breakdown.universidades += (cap.universidades || 0)
            breakdown.univsPublica += (cap.univsPublica || 0)
            breakdown.univsPrivada += (cap.univsPrivada || 0)
            breakdown.institutosFederais += (cap.campiIFs || 0)
            breakdown.icts += cap.icts || 0
            breakdown.centrosPesquisa += cap.centrosPesquisa || 0
            breakdown.espacosDinamizadores += cap.espacosDinamizadores || 0
            breakdown.parquesTecnologicos += cap.parquesTecnologicos || 0
            breakdown.incubadoras += cap.incubadoras || 0
          }

          if (Array.isArray(item.cadeiasProdutivasDetalhado)) {
            totalAplsCount += item.cadeiasProdutivasDetalhado.length
          }

          if (Array.isArray(item.cursosDetalhado)) {
            totalCursosCount += item.cursosDetalhado.length
          }

          if (item.desenvolvimento?.ifdmTi && item.desenvolvimento?.populacaoTotal) {
            ifdmWeightedSum += item.desenvolvimento.ifdmTi * item.desenvolvimento.populacaoTotal
            ifdmPopSum += item.desenvolvimento.populacaoTotal
          }
        })

        if (breakdown.univsPublica === 0 && breakdown.univsPrivada === 0 && breakdown.universidades > 0) {
          breakdown.univsPublica = breakdown.universidades
        }

        const ifdm = ifdmPopSum > 0 ? ifdmWeightedSum / ifdmPopSum : 0

        setLiveStats(buildStats(totalEntidades, conectaStats))
        setAssistenciaTerritorios(totalAssistencia)
        setEntityBreakdown(breakdown)
        setTotalApls(totalAplsCount)
        setTotalCursos(totalCursosCount)
        setIfdmMedio(ifdm)

        saveCachedAboutStats({
          totalEntidades,
          assistenciaTerritorios: totalAssistencia,
          entityBreakdown: breakdown,
          totalApls: totalAplsCount,
          totalCursos: totalCursosCount,
          ifdmMedio: ifdm,
          territoriesConecta: conectaStats.territoriesCount,
          municipalitiesConecta: conectaStats.municipalitiesCount,
          installedPointsConecta: conectaStats.installedPointsCount,
        })

        saveChatSnapshot("conecta", `Dados atualizados do Conecta Bahia:\n\n  \u2022 **${conectaStats.municipalitiesCount ?? "..."} municípios** com conectividade\n  \u2022 **${conectaStats.territoriesCount ?? "..."} territórios** de identidade cobertos\n  \u2022 **${conectaStats.installedPointsCount ?? "..."} praças** instaladas e ativas\n\nO Conecta Bahia é o programa estadual que leva internet gratuita a praças e espaços públicos nos municípios baianos.`)

        setDataStatus("ready")
      } catch (error) {
        console.warn("[AboutSection] Erro ao carregar dados integrados:", error)

        if (!active) return

        const cached = readCachedAboutStats()

        if (cached) {
          setLiveStats(buildStats(cached.totalEntidades, getConectaStatsFromCache(cached)))
          setAssistenciaTerritorios(cached.assistenciaTerritorios)
          setEntityBreakdown(cached.entityBreakdown ?? DEFAULT_ENTITY_BREAKDOWN)
          setTotalApls(cached.totalApls ?? 0)
          setTotalCursos(cached.totalCursos ?? 0)
          setIfdmMedio(cached.ifdmMedio ?? 0)
          setDataStatus("cached")
          return
        }

        setLiveStats(defaultStats)
        setDataStatus("error")
      } finally {
        isFetching = false
        scheduleNextRefresh()
      }
    }

    void loadStatsFromSources()

    return () => {
      active = false

      if (refreshTimer !== null) {
        clearTimeout(refreshTimer)
      }
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const loadLatestNewsBackground = async () => {
      try {
        const response = await fetch(`/api/hub/noticias?limit=${ABOUT_NEWS_LIMIT}&nocache=${Date.now()}`, {
          cache: "no-store",
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Falha ao carregar noticias para o fundo: status ${response.status}`)
        }

        const payload = (await response.json()) as AboutNewsApiResponse

        if (!isMounted) {
          return
        }

        const normalizedImages = (payload.items ?? [])
          .map((item) => item.preview?.image?.trim())
          .filter((image): image is string => typeof image === "string" && image.length > 0)
          .map((image) => normalizeNewsImageUrl(image))

        const seen = new Set<string>()
        const uniqueNonDefault = normalizedImages
          .filter((image) => {
            if (image === DEFAULT_NEWS_IMAGE || seen.has(image)) {
              return false
            }

            seen.add(image)
            return true
          })

        const selectedImages =
          uniqueNonDefault.length > 0
            ? uniqueNonDefault.slice(0, ABOUT_NEWS_LIMIT)
            : normalizedImages.slice(0, ABOUT_NEWS_LIMIT)

        const proxiedImages =
          selectedImages.length > 0
            ? selectedImages.map((image) => buildNewsImageProxyUrl(image))
            : [buildNewsImageProxyUrl(DEFAULT_NEWS_IMAGE)]

        setNewsBackgroundImages(fillBackgroundSlots(proxiedImages))
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }

        console.warn("[AboutSection] Nao foi possivel carregar imagens das noticias:", error)

        if (isMounted) {
          setNewsBackgroundImages([])
        }
      }
    }

    loadLatestNewsBackground()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  return (
    <section id="sobre" className="relative py-32 md:py-40 overflow-hidden">
      <style jsx global>{`
        @keyframes float-shape {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(10px, -20px) scale(1.05); }
          50% { transform: translate(-5px, 10px) scale(0.95); }
          75% { transform: translate(-15px, -10px) scale(1.02); }
        }
        
        @keyframes draw-line {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>

      {newsBackgroundImages.length > 0 && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-3 grid-rows-3 md:grid-rows-2">
            {newsBackgroundImages.map((image, index) => (
              <div key={`${image}-${index}`} className="relative overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url("${image}")`,
                    opacity: 0.70,
                    clipPath:
                      index % 2 === 0
                        ? "polygon(0 0, 100% 0, 80% 100%, 0% 100%)"
                        : "polygon(20% 0, 100% 0, 100% 100%, 0 100%)",
                    transform: index % 2 === 0 ? "scale(1.05) translateX(-2%)" : "scale(1.05) translateX(2%)",
                  }}
                />
                <div className="absolute inset-0 bg-white/70" />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/65 via-white/55 to-white/75" />
        </div>
      )}

      {/* Floating background shapes */}
      <FloatingShape color={colors.cyan} size={300} top="10%" left="5%" delay={0} />
      <FloatingShape color={colors.orange} size={200} top="60%" left="80%" delay={1} />
      <FloatingShape color={colors.magenta} size={250} top="80%" left="20%" delay={2} />
      <FloatingShape color={colors.green} size={180} top="20%" left="70%" delay={1.5} />

      {/* Animated grid lines */}
      <svg className="absolute inset-0 z-10 w-full h-full opacity-[0.03] pointer-events-none">
        <defs>
          <pattern id="about-grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#about-grid)" />
      </svg>

      <div className="relative z-20 px-6 md:px-10 lg:px-16 max-w-[1600px] mx-auto">
        
        {/* Section header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border/50 shadow-sm mb-6">
            <div className="flex -space-x-1">
              {Object.values(colors).slice(0, 4).map((color, i) => (
                <div 
                  key={i}
                  className="w-2.5 h-2.5 rounded-full border-2 border-white"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-muted-foreground">Sobre a SECTI</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
            Ciência, tecnologia e inovação
            <br />
            <span className="relative inline-block">
              para a{" "}
              <span 
                className="relative"
                style={{
                  background: `linear-gradient(135deg, ${colors.orange} 0%, ${colors.red} 50%, ${colors.magenta} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Bahia
              </span>
              {/* Decorative underline */}
              <svg 
                className="absolute -bottom-2 left-0 w-full h-3" 
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 6 Q50 0, 100 6 T200 6"
                  fill="none"
                  stroke={colors.orange}
                  strokeWidth="3"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 1000,
                    animation: "draw-line 2s ease-out forwards",
                  }}
                />
              </svg>
            </span>
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A Secretaria de Ciência, Tecnologia e Inovação trabalha para transformar 
            o estado através da tecnologia, promovendo desenvolvimento e qualidade de vida.
          </p>
        </div>

        {/* Stats - Bento Grid Style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-24">
          {liveStats.map((stat, i) => (
            <div
              key={`${stat.label}-${stat.value}`}
              onMouseEnter={() => setHoveredStat(i)}
              onMouseLeave={() => setHoveredStat(null)}
              onClick={stat.label === "Entidades Mapeadas" ? () => setShowEntityBreakdown((prev) => !prev) : undefined}
              className={`relative group ${stat.label === "Entidades Mapeadas" ? "cursor-pointer" : ""}`}
            >
              <div 
                className={`relative p-6 md:p-8 rounded-3xl bg-white border border-border/50 overflow-hidden transition-all duration-500 ${
                  hoveredStat === i ? "shadow-2xl scale-[1.02]" : "shadow-sm"
                }`}
              >
                {/* Animated background */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle at 50% 100%, ${stat.color}15, transparent 70%)`,
                  }}
                />
                
                {/* Top color indicator */}
                <div className="flex items-center gap-2 mb-4">
                  <div 
                    className="w-3 h-3 rounded-full transition-transform duration-300 group-hover:scale-125"
                    style={{ 
                      backgroundColor: stat.color,
                      boxShadow: hoveredStat === i ? `0 0 20px ${stat.color}80` : "none",
                    }}
                  />
                  <div 
                    className="h-px flex-1 transition-all duration-500"
                    style={{ 
                      backgroundColor: hoveredStat === i ? stat.color : "#e5e5e5",
                    }}
                  />
                </div>
                
                {/* Number */}
                <div 
                  className="text-4xl md:text-5xl lg:text-6xl font-black mb-2 transition-colors duration-300"
                  style={{ color: hoveredStat === i ? stat.color : "#1a1a1a" }}
                >
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                
                {/* Label */}
                <p className="text-sm md:text-base text-muted-foreground font-medium">
                  {stat.label}
                </p>
                
                {/* Corner decoration */}
                <div 
                  className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 transition-all duration-500 group-hover:scale-150"
                  style={{ backgroundColor: stat.color }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Entity Breakdown Modal */}
        {showEntityBreakdown && isMounted && createPortal(
          <div
            className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4"
            onClick={() => setShowEntityBreakdown(false)}
            style={{ zIndex: 2147483647 }}
          >
            <div
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl border border-gray-200/50"
              style={{ zIndex: 2147483647 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 md:p-8 text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <div className="w-6 h-6 bg-white rounded-full opacity-80 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Estrutura do Ecossistema de CT&I</h3>
                      <p className="text-white/80 text-sm mt-1">Distribuição de entidades por tipo na Bahia</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEntityBreakdown(false)}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 md:p-8">
                {/* Main visualization */}
                <div className="mb-8">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-full">
                      <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                      <span className="text-sm font-medium">Total: {totalEntidades} entidades</span>
                    </div>
                  </div>

                  {/* Enhanced grid with better visual hierarchy */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {ENTITY_BREAKDOWN_LABELS.map((item, index) => {
                      const count = entityBreakdown[item.key]
                      const percentage = totalEntidades > 0 ? (count / totalEntidades) * 100 : 0
                      
                      return (
                        <div
                          key={item.key}
                          className="group relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                        >
                          {/* Animated background accent */}
                          <div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ background: `linear-gradient(135deg, ${item.color}15, transparent)` }}
                          />
                          
                          {/* Progress bar */}
                          <div className="h-1 bg-gray-100">
                            <div 
                              className="h-full transition-all duration-1000 ease-out"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: item.color,
                                animationDelay: `${index * 100}ms`
                              }}
                            />
                          </div>

                          {/* Content */}
                          <div className="p-4 relative z-10">
                            <div className="flex items-center justify-between mb-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                   style={{ backgroundColor: `${item.color}15` }}>
                                <item.icon className="w-4 h-4" style={{ color: item.color }} />
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold" style={{ color: item.color }}>
                                  {count}
                                </div>
                                <div className="text-xs text-gray-500 font-medium">
                                  {percentage.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                            
                            <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                              {item.label}
                            </h4>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Additional metrics section */}
                <div className="bg-gradient-to-r from-gray-50 to-orange-50 rounded-xl p-6 border border-gray-100/50">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                    </svg>
                    Indicadores Complementares
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-100">
                      <div className="text-2xl font-bold text-blue-600 mb-1">{totalApls.toLocaleString()}</div>
                      <div className="text-xs text-gray-600 font-medium">Cadeias Produtivas (APL)</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-100">
                      <div className="text-2xl font-bold text-purple-600 mb-1">{totalCursos.toLocaleString()}</div>
                      <div className="text-xs text-gray-600 font-medium">Cursos de Ensino Superior</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-100">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {ifdmMedio > 0 ? ifdmMedio.toFixed(3) : "—"}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">IFDM Médio Ponderado</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Content grid */}
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Left column - Main text */}
          <div className="lg:col-span-2 flex flex-col justify-center">
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground leading-relaxed">
                A <strong className="text-foreground">Secretaria de Ciência, Tecnologia e Inovação</strong> atua 
                na formulação e implementação de políticas públicas que promovem o avanço 
                científico e a inovação tecnológica.
              </p>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Este hub digital centraliza as principais ferramentas e sistemas da secretaria, 
                facilitando o acesso para servidores, pesquisadores, gestores e todos os 
                cidadãos baianos.
              </p>
              
              <div className="pt-4">
                <Link
                  href="https://www.secti.ba.gov.br"
                  target="_blank"
                  className="group inline-flex items-center gap-3 px-6 py-3 rounded-full font-semibold transition-all duration-300 hover:gap-4"
                  style={{ 
                    backgroundColor: colors.blue,
                    color: "white",
                  }}
                >
                  <span>Conheça o Portal Oficial</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
          
          {/* Right column - Values grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {values.map((value, i) => (
                <div
                  key={value.title}
                  className="group relative p-5 md:p-6 rounded-2xl bg-white border border-border/50 hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden"
                  style={{ 
                    animationDelay: `${i * 100}ms`,
                  }}
                >
                  {/* Background gradient on hover */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(135deg, ${value.color}08, ${value.color}03)`,
                    }}
                  />
                  
                  {/* Icon */}
                  <div
                    className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{ backgroundColor: `${value.color}15` }}
                  >
                    <value.icon 
                      className="w-6 h-6 transition-transform duration-300" 
                      style={{ color: value.color }} 
                    />
                    
                    {/* Glow effect */}
                    <div 
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"
                      style={{ 
                        animation: "pulse-glow 2s ease-in-out infinite",
                      }}
                    />
                  </div>
                  
                  {/* Text */}
                  <h3 className="relative font-bold text-base mb-2 transition-colors duration-300 group-hover:text-[var(--hover-color)]" 
                    style={{ "--hover-color": value.color } as React.CSSProperties}
                  >
                    {value.title}
                  </h3>
                  {/* Bottom line */}
                  <div 
                    className="absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500"
                    style={{ backgroundColor: value.color }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom decorative element */}
  
      </div>
    </section>
  )
}
