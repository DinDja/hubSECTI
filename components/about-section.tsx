"use client"

import { useEffect, useRef, useState } from "react"
import { Lightbulb, Users, Rocket, Target, Zap, Globe, ArrowRight } from "lucide-react"
import Link from "next/link"
import { CONECTA_REFERENCE_TOTALS } from "@/lib/conecta-reference"

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

type TerritorialApiResponse = {
  summary?: {
    territories?: number
    totalEntidades?: number
  }
  territories?: Array<{
    capacidade?: {
      entidadesTotal?: number
    }
    assistenciaPublica?: {
      existe?: boolean
    }
  }>
}

type CachedAboutStats = {
  totalEntidades: number
  assistenciaTerritorios: number
}

const ABOUT_CACHE_KEY = "hub_about_stats_cache_v1"
const DEFAULT_ENTIDADES_FALLBACK = 500

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

function buildStats(totalEntidades: number): StatItem[] {
  return [
    { value: CONECTA_REFERENCE_TOTALS.territoriesCount, suffix: "", label: "Territórios Conecta", color: colors.cyan },
    { value: CONECTA_REFERENCE_TOTALS.municipalitiesCount, suffix: "", label: "Municípios Conecta", color: colors.green },
    { value: totalEntidades, suffix: "", label: "Entidades Mapeadas", color: colors.orange },
    { value: CONECTA_REFERENCE_TOTALS.installedPointsCount, suffix: "", label: "Praças Instaladas", color: colors.magenta },
  ]
}

const defaultStats = buildStats(DEFAULT_ENTIDADES_FALLBACK)

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

  useEffect(() => {
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
  }, [end, hasAnimated])

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
  const initialCachedStats = readCachedAboutStats()
  const [hoveredStat, setHoveredStat] = useState<number | null>(null)
  const [liveStats, setLiveStats] = useState<StatItem[]>(() =>
    buildStats(initialCachedStats?.totalEntidades ?? DEFAULT_ENTIDADES_FALLBACK),
  )
  const [dataStatus, setDataStatus] = useState<"loading" | "ready" | "cached" | "error">(
    initialCachedStats ? "cached" : "loading",
  )
  const [assistenciaTerritorios, setAssistenciaTerritorios] = useState(initialCachedStats?.assistenciaTerritorios ?? 0)

  useEffect(() => {
    let active = true

    const loadStatsFromSources = async () => {
      try {
        const territoriosRes = await fetch("/api/hub/territorios", { cache: "no-store" })

        if (!territoriosRes.ok) {
          throw new Error("Falha ao carregar dados das fontes integradas.")
        }

        const territoriosData = (await territoriosRes.json()) as TerritorialApiResponse

        if (!active) return

        const totalEntidadesRaw =
          territoriosData.summary?.totalEntidades ||
          (territoriosData.territories || []).reduce((sum, item) => sum + Number(item?.capacidade?.entidadesTotal || 0), 0)
        const totalEntidades = totalEntidadesRaw > 0
          ? totalEntidadesRaw
          : initialCachedStats?.totalEntidades || DEFAULT_ENTIDADES_FALLBACK
        const totalAssistencia = (territoriosData.territories || []).filter(
          (item) => item?.assistenciaPublica?.existe,
        ).length

        setLiveStats(buildStats(totalEntidades))
        setAssistenciaTerritorios(totalAssistencia)

        saveCachedAboutStats({
          totalEntidades,
          assistenciaTerritorios: totalAssistencia,
        })

        setDataStatus("ready")
      } catch (error) {
        console.warn("[AboutSection] Erro ao carregar dados integrados:", error)

        if (!active) return

        const cached = readCachedAboutStats()

        if (cached) {
          setLiveStats(buildStats(cached.totalEntidades))
          setAssistenciaTerritorios(cached.assistenciaTerritorios)
          setDataStatus("cached")
          return
        }

        setLiveStats(defaultStats)
        setDataStatus("error")
      }
    }

    loadStatsFromSources()

    return () => {
      active = false
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

      {/* Floating background shapes */}
      <FloatingShape color={colors.cyan} size={300} top="10%" left="5%" delay={0} />
      <FloatingShape color={colors.orange} size={200} top="60%" left="80%" delay={1} />
      <FloatingShape color={colors.magenta} size={250} top="80%" left="20%" delay={2} />
      <FloatingShape color={colors.green} size={180} top="20%" left="70%" delay={1.5} />

      {/* Animated grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none">
        <defs>
          <pattern id="about-grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#about-grid)" />
      </svg>

      <div className="relative px-6 md:px-10 lg:px-16 max-w-[1600px] mx-auto">
        
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
            Ciencia e tecnologia
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
            A Secretaria de Ciencia, Tecnologia e Inovacao trabalha para transformar 
            o estado atraves da tecnologia, promovendo desenvolvimento e qualidade de vida.
          </p>

          <p className="text-sm text-muted-foreground mt-5 max-w-3xl mx-auto">
            {dataStatus === "ready"
              ? `Dados integrados ao vivo de SECTI_TERRITORIOS e Conecta Bahia. ${assistenciaTerritorios} territorios com assistencia publica identificada. Totais do Conecta ajustados para a referencia validada (348 municipios, 27 territorios e 768 pracas instaladas).`
              : dataStatus === "cached"
                ? `Fonte territorial indisponivel no momento. Exibindo ultimo valor validado para entidades mapeadas (${liveStats[2]?.value.toLocaleString("pt-BR")}).`
              : dataStatus === "error"
                ? "Nao foi possivel atualizar os dados ao vivo agora. Os indicadores exibem a base inicial da secao."
                : "Carregando dados das fontes integradas para atualizar os indicadores..."}
          </p>
        </div>

        {/* Stats - Bento Grid Style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-24">
          {liveStats.map((stat, i) => (
            <div
              key={`${stat.label}-${stat.value}`}
              onMouseEnter={() => setHoveredStat(i)}
              onMouseLeave={() => setHoveredStat(null)}
              className="relative group"
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

        {/* Content grid */}
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Left column - Main text */}
          <div className="lg:col-span-2 flex flex-col justify-center">
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground leading-relaxed">
                A <strong className="text-foreground">Secretaria de Ciencia, Tecnologia e Inovacao</strong> atua 
                na formulacao e implementacao de politicas publicas que promovem o avanco 
                cientifico, a inovacao tecnologica e o desenvolvimento sustentavel.
              </p>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Este hub digital centraliza as principais ferramentas e sistemas da secretaria, 
                facilitando o acesso para servidores, pesquisadores, gestores e todos os 
                cidadaos baianos.
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
                  <span>Conheca o Portal Oficial</span>
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
