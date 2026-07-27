"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import {
  Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut, MapPin,
  Loader2, AlertCircle, ExternalLink, Building2, CheckCircle2,
  Clock, Wifi, Target, LayoutGrid, ArrowUpRight, Search,
  Filter, ChevronDown, ChevronUp
} from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { carregarMapa, TERRITORY_COLORS } from "@/lib/processa-mapa"
import { METRICAS_DISPONIVEIS } from "@/lib/mapa-data"
import type { TerritorioInfo, MetricKey, MunicipioRender, ConectaData, ConectaPonto } from "@/lib/mapa-types"
import type { MetricasExternas } from "@/lib/agregar-metricas"
import territoriosMunicipios from "@/lib/territorioMunicipios.json"
import { simplifyMunicipioName } from "@/lib/conecta-coverage"

function corPorMetrica(valor: number, max: number): string {
  if (max === 0) return "#e2e8f0"
  const t = valor / max
  if (t < 0.25) { const k = t / 0.25; return `rgb(${Math.round(238 - k * 60)},${Math.round(47 + k * 100)},${Math.round(90 - k * 50)})` }
  if (t < 0.5) { const k = (t - 0.25) / 0.25; return `rgb(${Math.round(178 + k * 0)},${Math.round(147 + k * 60)},${Math.round(40 + k * 10)})` }
  if (t < 0.75) { const k = (t - 0.5) / 0.25; return `rgb(${Math.round(178 - k * 100)},${Math.round(207 + k * 0)},${Math.round(50 + k * 50)})` }
  const k = (t - 0.75) / 0.25; return `rgb(${Math.round(78 + k * 22)},${Math.round(207 + k * 0)},${Math.round(100 - k * 0)})`
}

function getCentroid(d: string): { x: number; y: number } {
  const matches = d.matchAll(/(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)/g)
  let sumX = 0, sumY = 0, count = 0
  for (const m of matches) { sumX += parseFloat(m[1]); sumY += parseFloat(m[2]); count++ }
  return count > 0 ? { x: sumX / count, y: sumY / count } : { x: 0, y: 0 }
}

function sameMunicipio(a: string, b: string) {
  return simplifyMunicipioName(a) === simplifyMunicipioName(b)
}

const isInstalled = (v: unknown) => String(v || '').trim().toLowerCase() === 'instalado'

type CarregamentoState =
  | { tipo: "carregando" }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "pronto"; data: { municipios: MunicipioRender[]; territorios: TerritorioInfo[] } }

const SVG_W = 1000
const SVG_H = 1000

export function MapaSection({
  metricasExternas,
  conectaData,
}: {
  metricasExternas?: MetricasExternas
  conectaData?: ConectaData
}) {
  const [carregamento, setCarregamento] = useState<CarregamentoState>({ tipo: "carregando" })
  const [metricaAtiva, setMetricaAtiva] = useState<MetricKey>("totalMunicipios")
  const [modoCor, setModoCor] = useState<"territorio" | "metrica">("territorio")
  const [hoverado, setHoverado] = useState<string | null>(null)
  const [selecionado, setSelecionado] = useState<TerritorioInfo | null>(null)
  const [municipioClicado, setMunicipioClicado] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTerritory, setFilterTerritory] = useState("")
  const [filterMode, setFilterMode] = useState<"instalado" | "todos">("instalado")
  const [showTerritoryDropdown, setShowTerritoryDropdown] = useState(false)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [targetZoom, setTargetZoom] = useState(1)
  const [targetPan, setTargetPan] = useState({ x: 0, y: 0 })
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const mouseThrottleRef = useRef<number>(0)
  const centroidsCache = useRef<Map<string, { x: number; y: number }> | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const data = await carregarMapa(metricasExternas)
        if (!active) return
        setCarregamento({ tipo: "pronto", data })
      } catch (err) {
        if (!active) return
        setCarregamento({ tipo: "erro", mensagem: err instanceof Error ? err.message : "Erro ao carregar mapa" })
      }
    }
    load()
    return () => { active = false }
  }, [metricasExternas])

  // Smooth zoom animation (stops when close enough to target)
  useEffect(() => {
    let doneZoom = false
    let donePan = false
    const animate = () => {
      setZoom((prev) => {
        const diff = targetZoom - prev
        if (Math.abs(diff) < 0.005) { doneZoom = true; return targetZoom }
        return prev + diff * 0.2
      })
      setPan((prev) => {
        const dx = targetPan.x - prev.x
        const dy = targetPan.y - prev.y
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) { donePan = true; return targetPan }
        return { x: prev.x + dx * 0.2, y: prev.y + dy * 0.2 }
      })
      if (doneZoom && donePan) return
      animFrameRef.current = requestAnimationFrame(animate)
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    animFrameRef.current = requestAnimationFrame(animate)
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [targetZoom, targetPan])

  const data = carregamento.tipo === "pronto" ? carregamento.data : null
  const municipios = data?.municipios ?? []
  const territorios = data?.territorios ?? []

  const metricaLabel = METRICAS_DISPONIVEIS.find((m) => m.key === metricaAtiva)

  const metricMax = useMemo(() => {
    if (modoCor !== "metrica") return 1
    let max = 0
    for (const t of territorios) {
      if ((t.metricas[metricaAtiva] || 0) > max) max = t.metricas[metricaAtiva] || 0
    }
    return max || 1
  }, [territorios, metricaAtiva, modoCor])

  const territorioById = useMemo(() => {
    const map = new Map<number, TerritorioInfo>()
    for (const t of territorios) map.set(t.id, t)
    return map
  }, [territorios])

  const municipioCor = useMemo(() => {
    const m = new Map<number, string>()
    if (modoCor === "territorio") return m
    for (const t of territorios) {
      m.set(t.id, corPorMetrica(t.metricas[metricaAtiva] || 0, metricMax))
    }
    return m
  }, [territorios, modoCor, metricaAtiva, metricMax])

  const territorioColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    territorios.forEach((t) => {
      map[t.nome] = TERRITORY_COLORS[t.id - 1] || "#94A3B8"
    })
    return map
  }, [territorios])

  // Conecta data processing
  const installedSet = useMemo(() => {
    const set = new Set<string>()
    if (!conectaData) return set
    for (const [nome, pontos] of Object.entries(conectaData)) {
      const items = Array.isArray(pontos) ? pontos : []
      if (items.some((p) => isInstalled(p?.status_instalacao))) {
        set.add(simplifyMunicipioName(nome))
      }
    }
    return set
  }, [conectaData])

  const hasConecta = (nomeTopo: string) => {
    return installedSet.has(simplifyMunicipioName(nomeTopo))
  }

  const getConectaPoints = (nomeTopo: string): ConectaPonto[] => {
    if (!conectaData) return []
    for (const [nome, pontos] of Object.entries(conectaData)) {
      if (sameMunicipio(nome, nomeTopo)) {
        return Array.isArray(pontos) ? pontos.filter((p) => {
          if (filterMode === 'instalado') return isInstalled(p?.status_instalacao)
          return true
        }) : []
      }
    }
    return []
  }

  const installedTotal = useMemo(() => {
    if (!conectaData) return 0
    let count = 0
    for (const pontos of Object.values(conectaData)) {
      const items = Array.isArray(pontos) ? pontos : []
      count += items.filter((p) => isInstalled(p?.status_instalacao)).length
    }
    return count
  }, [conectaData])

  const municipiosConectados = useMemo(() => {
    return installedSet.size
  }, [installedSet])

  // Filtered
  const allTerritories = useMemo(() => {
    return [...new Set(territorios.map((t) => t.nome))].sort()
  }, [territorios])

  const passesFilters = (nomeTopo: string) => {
    const matchesSearch = simplifyMunicipioName(nomeTopo).includes(simplifyMunicipioName(searchTerm))
    const matchesTerritory = !filterTerritory || filterTerritory === "todos" ||
      territorios.find((t) => {
        const m = t.municipios.find((mun) => sameMunicipio(mun, nomeTopo))
        return m !== undefined && t.nome === filterTerritory
      }) !== undefined
    return matchesSearch && matchesTerritory
  }

  const filteredMunicipios = useMemo(() => {
    return municipios.filter((m) => passesFilters(m.nome))
  }, [municipios, searchTerm, filterTerritory, filterMode])

  // Centroids for point markers
  const municipioCentroids = useMemo(() => {
    return new Map(municipios.map((m) => [m.nome, getCentroid(m.d)]))
  }, [municipios])

  // Territory outline for filter
  const territoryOutline = useMemo(() => {
    if (!filterTerritory || !municipios.length) return ""
    const territorioMunicipios = municipios.filter((m) => {
      const t = territorioById.get(m.territorioId)
      return t?.nome === filterTerritory
    })
    if (!territorioMunicipios.length) return ""
    // Approximate outline: union of all paths with thick stroke
    const paths = territorioMunicipios.map((m) => m.d).join(" ")
    return paths
  }, [filterTerritory, municipios])

  const handleMouseDown = (e: React.MouseEvent) => setDragStart({ x: e.clientX, y: e.clientY })
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart) return
    setPan((p) => ({ x: p.x + (e.clientX - dragStart.x), y: p.y + (e.clientY - dragStart.y) }))
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleClickMunicipio = (nomeMunicipio: string) => {
    const centroid = municipioCentroids.get(nomeMunicipio)
    if (!centroid) return

    const zoomLevel = 2.0
    const newPan = {
      x: zoomLevel * (SVG_W / 2 - centroid.x),
      y: zoomLevel * (SVG_H / 2 - centroid.y),
    }
    setTargetZoom(zoomLevel)
    setTargetPan(newPan)
    setMunicipioClicado(nomeMunicipio)

    const t = territorioById.get(
      municipios.find((m) => m.nome === nomeMunicipio)?.territorioId ?? 0
    )
    if (t) setSelecionado(t)
  }

  if (carregamento.tipo === "carregando") {
    return (
      <section id="mapa" className="py-24 md:py-32">
        <div className="px-6 md:px-10 lg:px-16 max-w-[1600px] mx-auto">
          <MapaHeader />
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
            <p className="text-sm text-muted-foreground">Carregando mapa da Bahia...</p>
          </div>
        </div>
      </section>
    )
  }

  if (carregamento.tipo === "erro") {
    return (
      <section id="mapa" className="py-24 md:py-32">
        <div className="px-6 md:px-10 lg:px-16 max-w-[1600px] mx-auto">
          <MapaHeader />
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <p className="text-sm text-muted-foreground max-w-md">{carregamento.mensagem}</p>
            <button onClick={() => window.location.reload()} className="cursor-pointer mt-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-105" style={{ backgroundColor: "#0077C0" }}>
              Tentar novamente
            </button>
          </div>
        </div>
      </section>
    )
  }

  const wrapperClass = isFullscreen
    ? "fixed inset-0 z-[60] bg-[#f8fafc] flex flex-col"
    : "w-full grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4"

  return (
    <section id="mapa" className="py-24 md:py-32">
      <div className="px-6 md:px-10 lg:px-16 max-w-[1600px] mx-auto">
        <MapaHeader />

        {/* Controls */}
        <div className="mt-6 mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setModoCor("territorio")}
                className={`cursor-pointer px-4 py-2 text-sm font-medium transition-colors ${modoCor === "territorio" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              >
                Por território
              </button>
              <button
                onClick={() => setModoCor("metrica")}
                className={`cursor-pointer px-4 py-2 text-sm font-medium transition-colors ${modoCor === "metrica" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              >
                Por métrica
              </button>
            </div>

            {modoCor === "metrica" && (
              <select value={metricaAtiva} onChange={(e) => setMetricaAtiva(e.target.value as MetricKey)} className="cursor-pointer rounded-xl border border-border bg-card px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500/50">
                {METRICAS_DISPONIVEIS.map((m) => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {municipios.length} municípios · {territorios.length} territórios
          </p>
        </div>

        {/* Mapa + sidebar */}
        <div className={wrapperClass}>
          {/* Mapa */}
          <div
            className={
              isFullscreen
                ? "flex-1 cursor-grab active:cursor-grabbing relative overflow-hidden flex items-center justify-center bg-[#f8fafc]"
                : "h-[600px] lg:h-[700px] cursor-grab active:cursor-grabbing relative overflow-hidden flex items-center justify-center bg-[#f8fafc] rounded-2xl border border-border"
            }
            ref={mapContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={(e) => {
              handleMouseMove(e)
              const now = Date.now()
              if (now - mouseThrottleRef.current > 50 && mapContainerRef.current) {
                mouseThrottleRef.current = now
                const rect = mapContainerRef.current.getBoundingClientRect()
                setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
              }
            }}
            onMouseUp={() => setDragStart(null)}
            onMouseLeave={() => { setDragStart(null); setMousePos(null) }}
          >
            <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-full max-h-full select-none">
              <defs>
                <filter id="glow-hover" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#6366f1" floodOpacity="0.5" />
                </filter>
                <filter id="glow-selected" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#7c3aed" floodOpacity="0.7" />
                </filter>
                <filter id="shadow-subtle" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.1" />
                </filter>
                <filter id="marker-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#1E3A8A" floodOpacity="0.6" />
                </filter>
                <filter id="marker-glow-red" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#EF4444" floodOpacity="0.7" />
                </filter>
              </defs>
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {municipios.map((f) => {
                  const isHovered = hoverado === f.nome
                  const isSelected = selecionado?.id === f.territorioId
                  const hasConn = hasConecta(f.nome)
                  const passes = passesFilters(f.nome)

                  const baseCor = modoCor === "metrica"
                    ? (municipioCor.get(f.territorioId) || "#e2e8f0")
                    : f.cor

                  const fill = isSelected ? "#7c3aed" : (passes ? baseCor : "#e2e8f0")
                  const opacity = passes ? 1 : 0.3
                  const strokeCor = isHovered ? "#6366f1" : isSelected ? "#f8fafc" : "#ffffff"
                  const strokeW = (isSelected ? 2.0 : isHovered ? 1.5 : 0.6) / zoom
                  const filter = isSelected ? "url(#glow-selected)" : isHovered ? "url(#glow-hover)" : undefined

                  return (
                    <path
                      key={f.geocodigo}
                      d={f.d}
                      fill={fill}
                      fillOpacity={opacity}
                      stroke={strokeCor}
                      strokeWidth={strokeW}
                      strokeLinejoin="round"
                      filter={filter}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoverado(f.nome)}
                      onMouseLeave={() => setHoverado(null)}
                      onClick={() => handleClickMunicipio(f.nome)}
                    />
                  )
                })}

                {/* Territory outline when filtering */}
                {filterTerritory && territoryOutline && (
                  <g className="pointer-events-none">
                    <path d={territoryOutline} fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    <path d={territoryOutline} fill="none" stroke={territorioColorMap[filterTerritory] || "#6366f1"} strokeWidth="3" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  </g>
                )}

                {/* Point markers for installed municipalities */}
                {conectaData && municipios.map((f) => {
                  if (!hasConecta(f.nome) || !passesFilters(f.nome)) return null
                  const centroid = municipioCentroids.get(f.nome)
                  if (!centroid) return null
                  const isHovered = hoverado === f.nome
                  const isSelected = municipioClicado === f.nome
                  const active = isHovered || isSelected
                  const scale = active ? 1.6 : 1
                  const fillColor = isSelected ? "#EF4444" : "#1E3A8A"
                  const glowFilter = active ? (isSelected ? "url(#marker-glow-red)" : "url(#marker-glow)") : undefined
                  return (
                    <g key={`marker-${f.geocodigo}`}
                      className="pointer-events-none"
                      style={{ transform: `scale(${scale})`, transformOrigin: `${centroid.x}px ${centroid.y}px`, transition: "transform 0.2s ease-out" }}
                    >
                      <circle cx={centroid.x} cy={centroid.y} r={4} fill={fillColor} stroke="#FFFFFF" strokeWidth="1.5" filter={glowFilter} />
                    </g>
                  )
                })}
              </g>
            </svg>

            {/* Zoom controls */}
            <div className="absolute right-3 top-3 flex flex-col backdrop-blur-xl bg-white/85 shadow-xl rounded-xl border border-white/50 overflow-hidden z-10">
              <button onClick={() => setTargetZoom(Math.min(8, targetZoom + 0.5))} className="p-2.5 hover:bg-violet-100/70 text-slate-400 hover:text-violet-600 transition-all duration-200 cursor-pointer" title="Aumentar Zoom"><ZoomIn size={16} /></button>
              <div className="h-px bg-slate-100 mx-3" />
              <button onClick={() => setTargetZoom(Math.max(0.5, targetZoom - 0.5))} className="p-2.5 hover:bg-violet-100/70 text-slate-400 hover:text-violet-600 transition-all duration-200 cursor-pointer" title="Diminuir Zoom"><ZoomOut size={16} /></button>
              <div className="h-px bg-slate-100 mx-3" />
              <button onClick={() => { setTargetZoom(1); setTargetPan({ x: 0, y: 0 }); setMunicipioClicado(null); setFilterTerritory(""); setSearchTerm("") }} className="p-2.5 hover:bg-violet-100/70 text-slate-400 hover:text-violet-600 transition-all duration-200 cursor-pointer" title="Resetar"><RotateCcw size={16} /></button>
              <div className="h-px bg-slate-100 mx-3" />
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2.5 hover:bg-violet-100/70 text-slate-400 hover:text-violet-600 transition-all duration-200 cursor-pointer" title="Tela Cheia">
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>

            {/* Municipality hover tooltip */}
            {hoverado && mousePos && (() => {
              const t = territorioById.get(municipios.find((m) => m.nome === hoverado)?.territorioId ?? 0)
              const isLeft = mousePos.x < (mapContainerRef.current?.clientWidth ?? 600) / 2
              const isTop = mousePos.y < 200
              const posStyle = isLeft
                ? { left: `${mousePos.x + 18}px`, top: `${mousePos.y - (isTop ? 0 : 40)}px` }
                : { right: `${(mapContainerRef.current?.clientWidth ?? 600) - mousePos.x + 18}px`, top: `${mousePos.y - (isTop ? 0 : 40)}px` }
              return (
                <div
                  className="absolute bg-white/95 backdrop-blur-xl px-4 py-3 rounded-xl border border-slate-200/80 shadow-2xl pointer-events-none z-20 min-w-[190px]"
                  style={{
                    ...posStyle,
                    animation: "mapa-tooltip-in 0.2s ease-out forwards",
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin size={12} className="text-violet-500" />
                    <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Município</p>
                  </div>
                  <p className="font-bold text-sm text-slate-800 leading-tight mb-1">{hoverado}</p>
                  {t && (
                    <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm ring-1 ring-offset-1 ring-slate-300/50 shadow-sm" style={{ backgroundColor: TERRITORY_COLORS[t.id - 1] || "#e2e8f0" }} />
                        <p className="text-[11px] text-slate-600 font-medium">{t.nome}</p>
                      </div>
                      {hasConecta(hoverado) && (
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                          </span>
                          <p className="text-[11px] text-green-700 font-semibold">
                            {getConectaPoints(hoverado).length} ponto(s) instalado(s)
                          </p>
                        </div>
                      )}
                      {!hasConecta(hoverado) && conectaData && (
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                          <p className="text-[11px] text-slate-500 font-medium">Sem cobertura Conecta</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Stats bar on map */}
            {conectaData && (
              <div className="absolute bottom-4 left-4 backdrop-blur-xl bg-white/85 px-3.5 py-2.5 rounded-xl shadow-lg border border-white/50 pointer-events-none hidden md:flex items-center gap-5 z-10">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 h-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-600 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-700" />
                  </span>
                  <span className="text-[11px] text-slate-700 font-semibold">{municipiosConectados} <span className="font-normal text-slate-500">mun. conectados</span></span>
                </div>
                <div className="w-px h-4 bg-slate-200" />
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-[11px] text-slate-700 font-semibold">{installedTotal} <span className="font-normal text-slate-500">pontos instalados</span></span>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          {!isFullscreen && (
            <aside className="rounded-2xl border border-border bg-card p-5 h-[600px] lg:h-[700px] overflow-y-auto space-y-4">
              {/* Filters panel */}
              {conectaData && (
                <>
                  <button
                    onClick={() => setFiltersOpen(!filtersOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors ${filtersOpen ? "bg-violet-50 text-violet-700 border border-violet-200" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    <div className="flex items-center gap-2">
                      <Filter size={14} />
                      <span>{filtersOpen ? "Ocultar Filtros" : "Mostrar Filtros"}</span>
                    </div>
                    {filtersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {filtersOpen && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* Search */}
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscar município..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-cyan-500/50"
                        />
                      </div>

                      {/* Territory filter */}
                      <div className="relative">
                        <button
                          onClick={() => setShowTerritoryDropdown(!showTerritoryDropdown)}
                          className="w-full flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-xs text-left"
                        >
                          <span className={filterTerritory ? "text-foreground" : "text-muted-foreground"}>
                            {filterTerritory || "Todos os territórios"}
                          </span>
                          <ChevronDown size={14} className={showTerritoryDropdown ? "rotate-180 transition-transform" : "transition-transform"} />
                        </button>
                        {showTerritoryDropdown && (
                          <div className="absolute z-30 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            <button
                              onClick={() => { setFilterTerritory(""); setShowTerritoryDropdown(false) }}
                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted ${!filterTerritory ? "bg-violet-50 text-violet-700 font-semibold" : ""}`}
                            >
                              Todos os territórios
                            </button>
                            {allTerritories.map((t) => (
                              <button
                                key={t}
                                onClick={() => { setFilterTerritory(t); setShowTerritoryDropdown(false) }}
                                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2 ${filterTerritory === t ? "bg-violet-50 text-violet-700 font-semibold" : ""}`}
                              >
                                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: territorioColorMap[t] || "#94A3B8" }} />
                                {t}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Filter mode */}
                      <div>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">Modo de visualização</p>
                        <div className="inline-flex rounded-lg border border-border overflow-hidden">
                          <button
                            onClick={() => setFilterMode("instalado")}
                            className={`px-3 py-1.5 text-[10px] font-medium transition-colors cursor-pointer ${filterMode === "instalado" ? "bg-cyan-600 text-white" : "text-muted-foreground hover:bg-muted"}`}
                          >
                            Instalados
                          </button>
                          <button
                            onClick={() => setFilterMode("todos")}
                            className={`px-3 py-1.5 text-[10px] font-medium transition-colors cursor-pointer ${filterMode === "todos" ? "bg-cyan-600 text-white" : "text-muted-foreground hover:bg-muted"}`}
                          >
                            Todos
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Metrics summary */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center rounded-xl bg-blue-50 border border-blue-100/80 p-3 hover:shadow-md hover:scale-[1.03] transition-all duration-200 cursor-default">
                  <span className="text-lg font-bold text-blue-800">{municipiosConectados}</span>
                  <span className="text-[9px] text-blue-600 font-semibold text-center leading-tight">Mun. Conectados</span>
                </div>
                <div className="flex flex-col items-center rounded-xl bg-green-50 border border-green-100/80 p-3 hover:shadow-md hover:scale-[1.03] transition-all duration-200 cursor-default">
                  <span className="text-lg font-bold text-green-800">{installedTotal}</span>
                  <span className="text-[9px] text-green-600 font-semibold text-center leading-tight">Pontos Instalados</span>
                </div>
                <div className="flex flex-col items-center rounded-xl bg-cyan-50 border border-cyan-100/80 p-3 hover:shadow-md hover:scale-[1.03] transition-all duration-200 cursor-default">
                  <span className="text-lg font-bold text-cyan-800">{territorios.length}</span>
                  <span className="text-[9px] text-cyan-600 font-semibold text-center leading-tight">Territórios</span>
                </div>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {modoCor === "territorio" ? "Territórios" : metricaLabel?.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {modoCor === "territorio" ? "27 territórios de identidade" : `Total: ${territorios.reduce((s, t) => s + (t.metricas[metricaAtiva] || 0), 0)}`}
                </p>
              </div>

              {modoCor === "territorio" ? (
                <div className="grid grid-cols-1 gap-1">
                  {territorios.map((t) => {
                    const cor = TERRITORY_COLORS[t.id - 1] || "#e2e8f0"
                    const isSelected = selecionado?.id === t.id
                    const isFiltered = filterTerritory === t.nome
                    const active = isSelected || isFiltered
                    return (
                      <button
                        key={t.id}
                        onClick={() => { setSelecionado(t); setFilterTerritory("") }}
                        className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all duration-200 cursor-pointer border
                          ${active
                            ? "bg-violet-50 border-violet-200 shadow-sm scale-[1.02]"
                            : "hover:bg-slate-50 hover:border-slate-200 border-transparent hover:scale-[1.01] hover:shadow-sm"
                          }`}
                      >
                        <div className="relative flex-shrink-0">
                          <span className="block w-3 h-3 rounded-sm shadow-sm transition-transform duration-200 group-hover:scale-110" style={{ backgroundColor: cor }} />
                          {active && (
                            <span className="absolute -inset-1 rounded-sm ring-2 ring-violet-400/40 animate-pulse" style={{ borderColor: cor }} />
                          )}
                        </div>
                        <span className="flex-1 truncate text-xs text-foreground/90 group-hover:text-foreground transition-colors">
                          <span className="font-mono text-[10px] text-muted-foreground mr-1.5 group-hover:text-violet-500 transition-colors">{String(t.id).padStart(2, "0")}</span>
                          {t.nome}
                        </span>
                        <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors bg-muted/50 group-hover:bg-violet-100/50 px-1.5 py-0.5 rounded-full">{t.municipios.length}</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="h-3 w-full rounded-full overflow-hidden border border-border" style={{ background: `linear-gradient(to right, rgb(238,47,90), rgb(178,147,40), rgb(78,207,100))` }} />
                    <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                      <span>0</span>
                      <span className="font-semibold text-foreground">{metricMax}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {[...territorios].sort((a, b) => (b.metricas[metricaAtiva] || 0) - (a.metricas[metricaAtiva] || 0)).slice(0, 10).map((t, i) => (
                      <button key={t.id} onClick={() => setSelecionado(t)} className="group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left hover:bg-slate-50 transition-all duration-200 cursor-pointer border border-transparent hover:border-slate-200 hover:scale-[1.01]">
                        <span className="font-mono text-[10px] font-bold text-muted-foreground w-4 text-right">{i + 1}</span>
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: corPorMetrica(t.metricas[metricaAtiva] || 0, metricMax) }} />
                        <span className="flex-1 truncate text-xs text-foreground group-hover:text-foreground transition-colors">{t.nome}</span>
                        <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded-full">{t.metricas[metricaAtiva] || 0}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          )}
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet open={selecionado !== null} onOpenChange={(open) => { if (!open) { setSelecionado(null); setMunicipioClicado(null) } }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md p-0">
          {selecionado && (() => {
            const cor = TERRITORY_COLORS[selecionado.id - 1] || "#6366f1"
            return (
              <div className="flex flex-col h-full">
                <div className="relative px-6 pt-10 pb-8 text-white overflow-hidden" style={{ background: `linear-gradient(135deg, ${cor} 0%, ${cor}dd 40%, ${cor}99 100%)` }}>
                  <div className="absolute inset-0 opacity-[0.07]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
                  />
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/[0.04] -translate-y-1/2 translate-x-1/4 blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-black/[0.06] translate-y-1/2 -translate-x-1/4 blur-3xl" />
                  <div className="relative">
                    {municipioClicado && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <MapPin size={12} className="text-white/80" />
                        <p className="text-[11px] font-medium tracking-wide text-white/80 uppercase">{municipioClicado}</p>
                      </div>
                    )}
                    <SheetTitle className="text-2xl font-bold tracking-tight text-white">{selecionado.nome}</SheetTitle>
                    <SheetDescription className="text-white/70 mt-1.5 text-sm flex items-center gap-3">
                      <span>Território de Identidade</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/15 text-white/90 text-xs font-semibold">nº {selecionado.id}</span>
                    </SheetDescription>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                  {/* Métricas */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Indicadores</h4>
                      <div className="grid grid-cols-2 gap-2.5">
                        {METRICAS_DISPONIVEIS.map((m, i) => {
                          const icons = [<Target size={15} key="total" />, <CheckCircle2 size={15} key="concluidos" />, <Clock size={15} key="andamento" />, <Wifi size={15} key="conecta" />, <Building2 size={15} key="instaladas" />]
                          const iconColors = ["text-indigo-500", "text-emerald-500", "text-amber-500", "text-sky-500", "text-violet-500"]
                          const bgColors = ["bg-indigo-50", "bg-emerald-50", "bg-amber-50", "bg-sky-50", "bg-violet-50"]
                          return (
                            <div key={m.key} className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-3 hover:shadow-md hover:border-slate-300/60 transition-all duration-200 cursor-default">
                              <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${bgColors[i]} ${iconColors[i]}`}>{icons[i] || <LayoutGrid size={15} />}</span>
                              <div className="min-w-0">
                                <p className="text-lg font-bold text-foreground leading-none">{selecionado.metricas[m.key] || 0}</p>
                                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{m.label}</p>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>

                  {/* Pontos Conecta do município clicado */}
                  {municipioClicado && conectaData && (() => {
                    const pontos = getConectaPoints(municipioClicado)
                    if (pontos.length === 0) return null
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pontos Conecta</h4>
                          <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{pontos.length}</span>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {pontos.map((p, i) => (
                            <div key={i} className="bg-gradient-to-b from-white to-slate-50/80 border border-slate-200/80 rounded-lg px-3 py-2.5 space-y-1.5 hover:shadow-sm hover:border-slate-300/80 transition-all duration-200">
                              <div className="flex items-start gap-2">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 shadow-sm ${p.projeto === 'Conecta I' ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200/50' : 'bg-purple-100 text-purple-700 ring-1 ring-purple-200/50'}`}>
                                  {p.projeto || 'N/A'}
                                </span>
                                <span className="text-xs text-slate-700 leading-tight font-medium flex-1">{p.nome_da_praca || 'Sem nome'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 pl-1">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isInstalled(p.status_instalacao) ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                <span className="text-[8px] text-slate-400 uppercase font-semibold shrink-0">Status:</span>
                                <span className={`text-[10px] font-medium ${isInstalled(p.status_instalacao) ? 'text-emerald-700' : 'text-slate-500'}`}>{p.status_instalacao || '-'}</span>
                              </div>
                              {p.homologacao_prodeb && (
                                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 rounded-md px-2 py-1">
                                  <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                                  <span className="text-[10px] text-emerald-800 font-semibold">Homologado em {p.homologacao_prodeb}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Municípios */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Municípios</h4>
                      <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{selecionado.municipios.length}</span>
                    </div>
                    <div className="max-h-52 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                      {selecionado.municipios.map((m) => {
                        const hasConn = hasConecta(m)
                        return (
                          <div key={m} className={`flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors cursor-pointer ${m === municipioClicado ? "bg-violet-500/10 text-violet-700 font-medium" : "text-foreground/80 hover:bg-muted"}`}
                            onClick={() => handleClickMunicipio(m)}
                          >
                            <MapPin size={12} className="shrink-0 text-muted-foreground/40" />
                            <span className="flex-1">{m}</span>
                            {hasConn && <span className="w-2 h-2 rounded-full bg-green-500" title="Possui Conecta" />}
                            {m === municipioClicado && <span className="text-[10px] font-semibold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded-full">clicado</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Link externo */}
                  <a href={`https://www.ba.gov.br/secti/territorios/${selecionado.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between w-full rounded-xl border border-border bg-card/50 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors group">
                    <span>Ver no Portal SECTI</span>
                    <ArrowUpRight size={15} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                  </a>
                </div>
              </div>
            )
          })()}
        </SheetContent>
      </Sheet>
    </section>
  )
}

function MapaHeader() {
  return (
    <header className="flex flex-col gap-6 border-b border-border pb-10 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Geografia</p>
        <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          Mapa <span className="font-normal text-muted-foreground/50">Interativo</span>
        </h2>
      </div>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground md:text-base">
        Clique em um município para ver detalhes Conecta. Use os filtros para encontrar municípios e territórios.
      </p>
    </header>
  )
}
