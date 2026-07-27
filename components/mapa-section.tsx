"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut, MapPin, Loader2, AlertCircle, ExternalLink, Building2, CheckCircle2, Clock, Wifi, Target, LayoutGrid, ArrowUpRight } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { carregarMapa, TERRITORY_COLORS } from "@/lib/processa-mapa"
import { METRICAS_DISPONIVEIS } from "@/lib/mapa-data"
import type { TerritorioInfo, MetricKey, MunicipioRender } from "@/lib/mapa-types"
import type { MetricasExternas } from "@/lib/agregar-metricas"

function corPorMetrica(valor: number, max: number): string {
  if (max === 0) return "#e2e8f0"
  const t = valor / max
  if (t < 0.25) { const k = t / 0.25; return `rgb(${Math.round(238 - k * 60)},${Math.round(47 + k * 100)},${Math.round(90 - k * 50)})` }
  if (t < 0.5) { const k = (t - 0.25) / 0.25; return `rgb(${Math.round(178 + k * 0)},${Math.round(147 + k * 60)},${Math.round(40 + k * 10)})` }
  if (t < 0.75) { const k = (t - 0.5) / 0.25; return `rgb(${Math.round(178 - k * 100)},${Math.round(207 + k * 0)},${Math.round(50 + k * 50)})` }
  const k = (t - 0.75) / 0.25; return `rgb(${Math.round(78 + k * 22)},${Math.round(207 + k * 0)},${Math.round(100 - k * 0)})`
}

type CarregamentoState =
  | { tipo: "carregando" }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "pronto"; data: { municipios: MunicipioRender[]; territorios: TerritorioInfo[] } }

const SVG_W = 1000
const SVG_H = 1000

export function MapaSection({ metricasExternas }: { metricasExternas?: MetricasExternas }) {
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
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Carrega TopoJSON — executa de novo quando metricasExternas chegam do servidor
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
    if (modoCor === "territorio") return m // cada feature usa f.cor direto
    for (const t of territorios) {
      m.set(t.id, corPorMetrica(t.metricas[metricaAtiva] || 0, metricMax))
    }
    return m
  }, [territorios, modoCor, metricaAtiva, metricMax])

  const handleMouseDown = (e: React.MouseEvent) => setDragStart({ x: e.clientX, y: e.clientY })
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart) return
    setPan((p) => ({ x: p.x + (e.clientX - dragStart.x), y: p.y + (e.clientY - dragStart.y) }))
    setDragStart({ x: e.clientX, y: e.clientY })
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
            <button
              onClick={() => window.location.reload()}
              className="cursor-pointer mt-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: "#0077C0" }}
            >
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
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setModoCor("territorio")}
                className={`cursor-pointer px-4 py-2 text-sm font-medium transition-colors ${
                  modoCor === "territorio"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                Por território
              </button>
              <button
                onClick={() => setModoCor("metrica")}
                className={`cursor-pointer px-4 py-2 text-sm font-medium transition-colors ${
                  modoCor === "metrica"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                Por métrica
              </button>
            </div>

            {modoCor === "metrica" && (
              <select
                value={metricaAtiva}
                onChange={(e) => setMetricaAtiva(e.target.value as MetricKey)}
                className="cursor-pointer rounded-xl border border-border bg-card px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
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

        {/* Mapa + sidebar (contorno envolvente) */}
        <div className={wrapperClass}>
          {/* Mapa (espelha LocationMapFilter.jsx) */}
          <div
            className={
              isFullscreen
                ? "flex-1 cursor-grab active:cursor-grabbing relative overflow-hidden flex items-center justify-center bg-[#f8fafc]"
                : "h-[600px] lg:h-[700px] cursor-grab active:cursor-grabbing relative overflow-hidden flex items-center justify-center bg-[#f8fafc] rounded-2xl border border-border"
            }
            ref={mapContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setDragStart(null)}
            onMouseLeave={() => setDragStart(null)}
          >
            <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-full max-h-full select-none drop-shadow-sm">
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} transformOrigin="center">
                {municipios.map((f) => {
                  const isHovered = hoverado === f.nome
                  const isSelected = selecionado?.id === f.territorioId
                  const baseCor = modoCor === "metrica"
                    ? (municipioCor.get(f.territorioId) || "#e2e8f0")
                    : f.cor
                  const fill = isSelected ? "#7c3aed" : baseCor
                  const strokeCor = isHovered || isSelected ? "#1e293b" : "#ffffff"
                  const strokeW = (isSelected ? 1.5 : isHovered ? 1.2 : 0.6) / zoom

                  return (
                    <path
                      key={f.geocodigo}
                      d={f.d}
                      fill={fill}
                      stroke={strokeCor}
                      strokeWidth={strokeW}
                      strokeLinejoin="round"
                      className="cursor-pointer transition-colors duration-150 hover:brightness-110"
                      style={{
                        opacity: hoverado && hoverado !== f.nome ? 0.6 : 1,
                      }}
                      onMouseEnter={() => setHoverado(f.nome)}
                      onMouseLeave={() => setHoverado(null)}
                      onClick={() => {
                        const t = territorioById.get(f.territorioId)
                        if (t) { setSelecionado(t); setMunicipioClicado(f.nome) }
                      }}
                    />
                  )
                })}
              </g>
            </svg>

            {/* Zoom controls */}
            <div className="absolute right-3 top-3 flex flex-col bg-white/95 backdrop-blur-lg shadow-lg rounded-xl border border-slate-200/80 overflow-hidden z-10">
              <button
                onClick={() => setZoom((z) => Math.min(8, z + 0.5))}
                className="p-2.5 hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors cursor-pointer"
                title="Aumentar Zoom"
              >
                <ZoomIn size={16} />
              </button>
              <div className="h-px bg-slate-100 mx-2" />
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.5))}
                className="p-2.5 hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors cursor-pointer"
                title="Diminuir Zoom"
              >
                <ZoomOut size={16} />
              </button>
              <div className="h-px bg-slate-100 mx-2" />
              <button
                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
                className="p-2.5 hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors cursor-pointer"
                title="Resetar"
              >
                <RotateCcw size={16} />
              </button>
              <div className="h-px bg-slate-100 mx-2" />
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2.5 hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors cursor-pointer"
                title="Tela Cheia"
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>

            {/* Tooltip de município (igual ao mapfilter) */}
            {hoverado && (
              <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-xl px-4 py-3 rounded-xl border border-slate-200 shadow-xl pointer-events-none animate-fade-in z-20 min-w-[160px]">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin size={12} className="text-violet-500" />
                  <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Município</p>
                </div>
                <p className="font-bold text-sm text-slate-800 leading-tight mb-1">{hoverado}</p>
                {territorioById.get(municipios.find((m) => m.nome === hoverado)?.territorioId ?? 0) && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shadow-sm"
                      style={{
                        backgroundColor: TERRITORY_COLORS[
                          (municipios.find((m) => m.nome === hoverado)?.territorioId ?? 1) - 1
                        ] || "#e2e8f0",
                      }}
                    />
                    <p className="text-[11px] text-slate-600 font-medium truncate">
                      {territorioById.get(municipios.find((m) => m.nome === hoverado)?.territorioId ?? 0)?.nome}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar (não aparece em fullscreen) */}
          {!isFullscreen && (
            <aside className="rounded-2xl border border-border bg-card p-5 space-y-4 h-[600px] lg:h-[700px] overflow-y-auto">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {modoCor === "territorio" ? "Territórios" : metricaLabel?.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {modoCor === "territorio" ? "27 territórios de identidade" : `Total: ${territorios.reduce((s, t) => s + (t.metricas[metricaAtiva] || 0), 0)}`}
                </p>
              </div>

              {/* Legenda */}
              {modoCor === "territorio" ? (
                <div className="grid grid-cols-1 gap-1.5">
                  {territorios.map((t) => {
                    const cor = TERRITORY_COLORS[t.id - 1] || "#e2e8f0"
                    const isSelected = selecionado?.id === t.id
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelecionado(t)}
                        className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer ${
                          isSelected ? "bg-violet-50 border border-violet-200" : "hover:bg-muted border border-transparent"
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-sm shrink-0 shadow-sm"
                          style={{ backgroundColor: cor }}
                        />
                        <span className="flex-1 truncate text-xs text-foreground">
                          <span className="font-mono text-[10px] text-muted-foreground mr-1.5">
                            {String(t.id).padStart(2, "0")}
                          </span>
                          {t.nome}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {t.municipios.length}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div
                      className="h-3 w-full rounded-full overflow-hidden border border-border"
                      style={{
                        background: `linear-gradient(to right, rgb(238,47,90), rgb(178,147,40), rgb(78,207,100))`,
                      }}
                    />
                    <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                      <span>0</span>
                      <span className="font-semibold text-foreground">{metricMax}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[...territorios]
                      .sort((a, b) => (b.metricas[metricaAtiva] || 0) - (a.metricas[metricaAtiva] || 0))
                      .slice(0, 10)
                      .map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setSelecionado(t)}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left hover:bg-muted transition-colors cursor-pointer"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: corPorMetrica(t.metricas[metricaAtiva] || 0, metricMax) }}
                          />
                          <span className="flex-1 truncate text-xs text-foreground">{t.nome}</span>
                          <span className="text-xs font-semibold text-cyan-700">
                            {t.metricas[metricaAtiva] || 0}
                          </span>
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
            const cor = TERRITORY_COLORS[selecionado.id - 1] || "#6366f1";
            return (
              <div className="flex flex-col h-full">
                {/* Header com cor do território */}
                <div className="relative px-6 pt-10 pb-8 text-white" style={{ backgroundColor: cor }}>
                  <div className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                  />
                  <div className="relative">
                    {municipioClicado && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <MapPin size={12} className="text-white/80" />
                        <p className="text-[11px] font-medium tracking-wide text-white/80 uppercase">
                          {municipioClicado}
                        </p>
                      </div>
                    )}
                    <SheetTitle className="text-2xl font-bold tracking-tight text-white">
                      {selecionado.nome}
                    </SheetTitle>
                    <SheetDescription className="text-white/80 mt-1.5 text-sm">
                      Território de Identidade nº {selecionado.id}
                    </SheetDescription>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                  {/* Métricas */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Indicadores
                    </h4>
                    <div className="grid grid-cols-2 gap-2.5">
                      {(() => {
                        const icons = [
                          <Target size={16} key="total" />,
                          <CheckCircle2 size={16} key="concluidos" />,
                          <Clock size={16} key="andamento" />,
                          <Wifi size={16} key="conecta" />,
                          <Building2 size={16} key="instaladas" />,
                        ];
                        return METRICAS_DISPONIVEIS.map((m, i) => (
                          <div
                            key={m.key}
                            className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-3"
                          >
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-muted-foreground">
                              {icons[i] || <LayoutGrid size={16} />}
                            </span>
                            <div className="min-w-0">
                              <p className="text-lg font-bold text-foreground leading-none">
                                {selecionado.metricas[m.key] || 0}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                {m.label}
                              </p>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Municípios */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Municípios
                      </h4>
                      <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {selecionado.municipios.length}
                      </span>
                    </div>
                    <div className="max-h-52 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                      {selecionado.municipios.map((m) => (
                        <div
                          key={m}
                          className={`flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${
                            m === municipioClicado
                              ? "bg-violet-500/10 text-violet-700 font-medium"
                              : "text-foreground/80 hover:bg-muted"
                          }`}
                        >
                          <MapPin size={12} className="shrink-0 text-muted-foreground/40" />
                          <span>{m}</span>
                          {m === municipioClicado && (
                            <span className="ml-auto text-[10px] font-semibold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded-full">
                              clicado
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Link externo */}
                  <a
                    href={`https://www.ba.gov.br/secti/territorios/${selecionado.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full rounded-xl border border-border bg-card/50 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors group"
                  >
                    <span>Ver no Portal SECTI</span>
                    <ArrowUpRight size={15} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                  </a>
                </div>
              </div>
            );
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
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Geografia
        </p>
        <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          Mapa{" "}
          <span className="font-normal text-muted-foreground/50">Interativo</span>
        </h2>
      </div>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground md:text-base">
        Clique em um município para ver o território. Arraste para navegar, use os
        controles para zoom e tela cheia.
      </p>
    </header>
  )
}
