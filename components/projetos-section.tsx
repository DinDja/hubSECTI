"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  FolderKanban,
  MapPin,
  Users,
  CalendarClock,
  Loader2,
  AlertCircle,
  RefreshCcw,
  Building2,
  Search,
  ChevronDown,
  X,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  FileText,
  Target,
  Lightbulb,
  AlertTriangle,
  Eye,
  ClipboardList,
  DollarSign,
  CheckCircle2,
  ImageOff,
} from "lucide-react"

type Projeto = {
  id: string
  titulo?: string; natureza?: string; status?: string; estadoAtual?: string
  instituicao?: string; unidade?: string; responsavel?: string; parceiros?: string
  periodo?: string; estado?: string; territorio?: string[] | string; municipio?: string[] | string
  beneficiarios?: string; nmrBeneficiarios?: string | number; investimentoReal?: string
  paoe?: string; fonteFinanciamento?: string[] | string; localExecucao?: string
  metaFisica?: string; execucaoFisica?: string; execucaoFinanceira?: string
  objetivoGeral?: string; objetivosEspecificos?: string; fotos?: string[]
  updatedAt?: string | null
}

type ApiResposta = {
  total: number; limit: number; offset: number; hasMore: boolean; projetos: Projeto[]
} | { error: string; details?: string }

const COLORS = { cyan: "#00B5AD", green: "#7AC143", blue: "#0077C0", orange: "#F7941D", yellow: "#FDB913" }

const formatter = new Intl.NumberFormat("pt-BR")

function ListaTexto({ valor }: { valor: unknown }) {
  if (!valor) return null
  if (Array.isArray(valor)) return <>{valor.join(", ")}</>
  return <>{String(valor)}</>
}

export function ProjetosSection() {
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const buscaRef = useRef("")
  const LIMIT = 12

  const carregar = useCallback(async (novoOffset: number, append: boolean) => {
    if (novoOffset === 0) setIsLoading(true)
    else setIsLoadingMore(true)
    setError(null)

    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(novoOffset) })
      if (buscaRef.current) params.set("search", buscaRef.current)

      const res = await fetch(`/api/hub/projetos?${params}&ts=${Date.now()}`, {
        cache: "no-store", headers: { Accept: "application/json" },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as ApiResposta
      if ("error" in data) throw new Error(data.error)

      setProjetos((prev) => (append ? [...prev, ...data.projetos] : data.projetos))
      setTotal(data.total)
      setOffset(novoOffset + data.projetos.length)
      setHasMore(data.hasMore)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar projetos.")
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  useEffect(() => { buscaRef.current = busca }, [busca])

  const handleBusca = () => {
    buscaRef.current = busca
    carregar(0, false)
  }

  useEffect(() => { carregar(0, false) }, [carregar])

  const statusOptions = useMemo(() => {
    const set = new Set<string>()
    projetos.forEach((p) => { if (p.status) set.add(p.status) })
    return ["todos", ...Array.from(set).sort()]
  }, [projetos])

  const projetosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo && filtroStatus === "todos") return projetos
    return projetos.filter((p) => {
      if (filtroStatus !== "todos" && p.status !== filtroStatus) return false
      if (!termo) return true
      const campos = [p.titulo, p.instituicao, p.unidade, p.responsavel, p.natureza, p.objetivoGeral]
        .filter(Boolean).join(" ").toLowerCase()
      return campos.includes(termo)
    })
  }, [projetos, busca, filtroStatus])

  return (
    <section id="projetos" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-5 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${COLORS.cyan}, ${COLORS.blue}, transparent)` }} />

      <div className="relative px-6 md:px-10 lg:px-16 max-w-[1600px] mx-auto">
        <div className="text-center mb-12">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-white/80 px-4 py-2 text-sm font-semibold">
            <FolderKanban className="w-4 h-4 text-cyan-600" />
            Projetos SECTI
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 mt-4">
            Projetos{" "}
            <span style={{
              background: `linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.blue})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              Cadastrados
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Acompanhamento dos projetos estratégicos da SECTI, com metas, indicadores e execução.
          </p>
        </div>

        {/* Busca + Filtros */}
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text" value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleBusca()}
              placeholder="Buscar por título, instituição, responsável..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer">
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s === "todos" ? "Todos os status" : s}</option>
            ))}
          </select>
          <button onClick={handleBusca} disabled={isLoading}
            className="cursor-pointer px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: COLORS.blue }}>
            <Search className="w-4 h-4" />
            Buscar
          </button>
          <button onClick={() => carregar(0, false)} disabled={isLoading}
            className="cursor-pointer px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: COLORS.blue }}>
            <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
            <p className="text-sm text-muted-foreground">Carregando projetos do SECTI...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <p className="text-sm text-muted-foreground max-w-md">{error}</p>
            <button onClick={() => carregar(0, false)}
              className="cursor-pointer mt-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: COLORS.blue }}>Tentar novamente</button>
          </div>
        ) : projetosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <FolderKanban className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum projeto encontrado com os filtros atuais.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {total} projeto{total !== 1 ? "s" : ""}
                {projetosFiltrados.length < total && ` (${projetosFiltrados.length} exibidos)`}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {projetosFiltrados.map((p, i) => (
                <button key={p.id} onClick={() => setSelectedId(p.id)} className="cursor-pointer text-left w-full">
                  <ProjetoCard projeto={p} index={i} />
                </button>
              ))}
            </div>

            {/* Load More */}
            {hasMore && projetosFiltrados.length >= offset && (
              <div className="flex justify-center mt-10">
                <button onClick={() => carregar(offset, true)} disabled={isLoadingMore}
                  className="cursor-pointer inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-105 disabled:opacity-50"
                  style={{ backgroundColor: COLORS.cyan }}>
                  {isLoadingMore ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</>
                  ) : (
                    <><ChevronDown className="w-4 h-4" /> Carregar mais projetos</>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedId && (
        <ProjetoDetailModal
          projectId={selectedId}
          projetos={projetos}
          onClose={() => setSelectedId(null)}
          onNavigate={(id) => setSelectedId(id)}
        />
      )}
    </section>
  )
}

function ProjetoCard({ projeto: p, index }: { projeto: Projeto; index: number }) {
  const [imgError, setImgError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const fotoUrl = p.fotos?.[0]
  const hasFoto = !!fotoUrl && !imgError
  const atualizado = p.updatedAt ? new Date(p.updatedAt) : null

  return (
    <article
      className="group flex h-full animate-fade-in flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors duration-300"
      style={{
        animationDelay: `${index * 80}ms`,
        borderColor: isHovered ? `${COLORS.cyan}66` : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Preview */}
      <div className="relative aspect-[16/10] overflow-hidden border-b border-border bg-gradient-to-br from-cyan-50 to-blue-50">
        {hasFoto ? (
          <img
            src={fotoUrl}
            alt={p.titulo || "Projeto"}
            className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FolderKanban className="h-8 w-8 text-cyan-200" />
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Status badge */}
        {p.status && (
          <div className="absolute left-3 top-3 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.green }} />
              {p.status}
            </span>
          </div>
        )}

        {/* Natureza badge */}
        {p.natureza && (
          <div className="absolute right-3 top-3 z-10">
            <span className="inline-flex items-center rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
              {p.natureza}
            </span>
          </div>
        )}

        {/* Action on hover */}
        <div className="absolute bottom-3 right-3 z-20 flex translate-y-1 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-background/95 px-3 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
            <Eye className="h-3.5 w-3.5" />
            Ver detalhes
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Meta header */}
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.cyan }} />
            {p.natureza || p.status || "Projeto"}
          </span>
          <span>{String(index + 1).padStart(2, "0")}</span>
        </div>

        {/* Title */}
        <h3 className="mt-3 text-lg font-semibold tracking-tight line-clamp-2">{p.titulo || "(sem título)"}</h3>

        {/* Institution */}
        {(p.instituicao || p.unidade) && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{[p.instituicao, p.unidade].filter(Boolean).join(" · ")}</span>
          </p>
        )}

        {/* Objective */}
        {p.objetivoGeral && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{p.objetivoGeral}</p>
        )}

        <div aria-hidden className="mt-auto min-h-4" />

        {/* Metadata row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {p.responsavel && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3 shrink-0" />
              <span className="truncate max-w-[140px]">{p.responsavel}</span>
            </span>
          )}
          {(p.municipio || p.estado) && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate max-w-[140px]">
                <ListaTexto valor={p.municipio} />
                {p.municipio && p.estado ? " · " : ""}{p.estado}
              </span>
            </span>
          )}
          {atualizado && (
            <span className="flex items-center gap-1">
              <CalendarClock className="h-3 w-3 shrink-0" />
              {atualizado.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="mt-4 border-t border-border" />

        {/* Bottom row: tags + action */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {p.nmrBeneficiarios != null && p.nmrBeneficiarios !== "" && (
              <span className="rounded-md px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: `${COLORS.orange}15`, color: COLORS.orange }}>
                {formatter.format(Number(p.nmrBeneficiarios))} benef.
              </span>
            )}
            {p.investimentoReal && (
              <span className="rounded-md px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: `${COLORS.green}15`, color: COLORS.green }}>
                Investimento
              </span>
            )}
            {p.periodo && (
              <span className="rounded-md px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: `${COLORS.blue}15`, color: COLORS.blue }}>
                {p.periodo}
              </span>
            )}
          </div>

          <span className="group/link inline-flex shrink-0 items-center gap-1 text-sm font-medium text-foreground">
            Detalhes
            <ArrowUpRight
              className="h-4 w-4 transition-all duration-300 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
              style={{ color: isHovered ? COLORS.cyan : undefined }}
            />
          </span>
        </div>
      </div>
    </article>
  )
}

const FIELD_LABELS: Record<string, string> = {
  contexto: "Contextualização",
  problemaDemanda: "Problema / Demanda",
  justificativa: "Justificativa",
  objetivoGeral: "Objetivo Geral",
  objetivosEspecificos: "Objetivos Específicos",
  beneficiarios: "Beneficiários",
  sustentabilidade: "Sustentabilidade",
  riscos: "Riscos",
  pendencias: "Pendências",
  observacoes: "Observações",
  recursosHumanos: "Recursos Humanos",
  recursosMateriais: "Recursos Materiais",
  metaFisica: "Meta Física",
  execucaoFisica: "Execução Física",
  execucaoFinanceira: "Execução Financeira",
  indicadoresProcesso: "Indicadores de Processo",
  indicadoresResultado: "Resultados Esperados",
  investimentoReal: "Investimento Real",
  paoe: "PAOE",
  localExecucao: "Local de Execução",
  numeroProcessoSEI: "Nº Processo SEI",
  periodo: "Período",
  estado: "Estado",
  territorio: "Território",
  municipio: "Município",
  instituicao: "Instituição",
  unidade: "Unidade",
  responsavel: "Responsável",
  parceiros: "Parceiros",
  natureza: "Natureza",
  status: "Status",
  estadoAtual: "Estado Atual",
  fonteFinanciamento: "Fonte de Financiamento",
}

function FieldSection({ label, value }: { label: string; value: unknown }) {
  if (!value) return null
  const display = Array.isArray(value) ? value.join(", ") : String(value)
  if (!display.trim()) return null

  return (
    <div className="space-y-1">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</h4>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{display}</p>
    </div>
  )
}

function ProjetoDetailModal({
  projectId, projetos, onClose, onNavigate,
}: {
  projectId: string
  projetos: Projeto[]
  onClose: () => void
  onNavigate: (id: string) => void
}) {
  const [projeto, setProjeto] = useState<Projeto | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [fotoIndex, setFotoIndex] = useState(0)
  const [imgErro, setImgErro] = useState(false)

  const idxAtual = useMemo(() => projetos.findIndex((p) => p.id === projectId), [projetos, projectId])
  const prevId = idxAtual > 0 ? projetos[idxAtual - 1].id : null
  const nextId = idxAtual < projetos.length - 1 ? projetos[idxAtual + 1].id : null

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  useEffect(() => {
    setLoading(true)
    setErro(null)
    setFotoIndex(0)
    setImgErro(false)

    fetch(`/api/hub/projetos/${projectId}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setProjeto(data as Projeto)
      })
      .catch((err) => setErro(err.message))
      .finally(() => setLoading(false))
  }, [projectId])

  const fotos = projeto?.fotos || []
  const fotoAtual = fotos[fotoIndex]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden bg-white shadow-2xl animate-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="cursor-pointer p-2 rounded-xl hover:bg-muted transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div>
              <h3 className="font-bold text-lg line-clamp-1">{projeto?.titulo || "Carregando..."}</h3>
              {projeto?.status && (
                <span className="text-xs text-muted-foreground">{projeto.status}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {prevId && (
              <button onClick={() => onNavigate(prevId)}
                className="cursor-pointer p-2 rounded-xl hover:bg-muted transition-colors" title="Anterior">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            {nextId && (
              <button onClick={() => onNavigate(nextId)}
                className="cursor-pointer p-2 rounded-xl hover:bg-muted transition-colors" title="Próximo">
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
            </div>
          ) : erro ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <AlertCircle className="w-10 h-10 text-red-500" />
              <p className="text-sm text-muted-foreground">{erro}</p>
            </div>
          ) : projeto ? (
            <div className="space-y-8">
              {/* Gallery */}
              {fotos.length > 0 && (
                <div className="space-y-3">
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted">
                    {!imgErro ? (
                      <img src={fotoAtual} alt=""
                        className="w-full h-full object-contain bg-black/5"
                        onError={() => setImgErro(true)} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ImageOff className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  {fotos.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {fotos.map((f, i) => (
                        <button key={i} onClick={() => { setFotoIndex(i); setImgErro(false) }}
                          className={`cursor-pointer shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${i === fotoIndex ? "border-cyan-500" : "border-transparent hover:border-muted-foreground/30"}`}>
                          <img src={f} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FieldSection label="Natureza" value={projeto.natureza} />
                <FieldSection label="Status" value={projeto.status} />
                <FieldSection label="Estado Atual" value={projeto.estadoAtual} />
                <FieldSection label="Instituição" value={projeto.instituicao} />
                <FieldSection label="Unidade" value={projeto.unidade} />
                <FieldSection label="Responsável" value={projeto.responsavel} />
                <FieldSection label="Parceiros" value={projeto.parceiros} />
                <FieldSection label="Período" value={projeto.periodo} />
                <FieldSection label="Local de Execução" value={projeto.localExecucao} />
                <FieldSection label="Estado" value={projeto.estado} />
                <FieldSection label="Território" value={projeto.territorio} />
                <FieldSection label="Município" value={projeto.municipio} />
                <FieldSection label="Nº Beneficiários" value={projeto.nmrBeneficiarios} />
                <FieldSection label="Investimento Real" value={projeto.investimentoReal} />
                <FieldSection label="PAOE" value={projeto.paoe} />
                <FieldSection label="Fonte de Financiamento" value={projeto.fonteFinanciamento} />
                <FieldSection label="Meta Física" value={projeto.metaFisica} />
                <FieldSection label="Execução Física" value={projeto.execucaoFisica} />
                <FieldSection label="Execução Financeira" value={projeto.execucaoFinanceira} />
                <FieldSection label="Nº Processo SEI" value={projeto.numeroProcessoSEI} />
              </div>

              {/* Descrições */}
              <div className="space-y-6 pt-4 border-t border-border">
                <FieldSection label="Contextualização" value={projeto.contexto} />
                <FieldSection label="Problema / Demanda" value={projeto.problemaDemanda} />
                <FieldSection label="Justificativa" value={projeto.justificativa} />
                <FieldSection label="Objetivo Geral" value={projeto.objetivoGeral} />
                <FieldSection label="Objetivos Específicos" value={projeto.objetivosEspecificos} />
                <FieldSection label="Beneficiários" value={projeto.beneficiarios} />
                <FieldSection label="Sustentabilidade" value={projeto.sustentabilidade} />
                <FieldSection label="Riscos" value={projeto.riscos} />
                <FieldSection label="Pendências" value={projeto.pendencias} />
                <FieldSection label="Observações" value={projeto.observacoes} />
              </div>

              {/* Indicadores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                <FieldSection label="Indicadores de Processo" value={projeto.indicadoresProcesso} />
                <FieldSection label="Resultados Esperados" value={projeto.indicadoresResultado} />
                <FieldSection label="Recursos Humanos" value={projeto.recursosHumanos} />
                <FieldSection label="Recursos Materiais" value={projeto.recursosMateriais} />
              </div>

              {/* Footer info */}
              {projeto.updatedAt && (
                <p className="text-xs text-muted-foreground pt-4 border-t border-border">
                  Última atualização: {new Date(projeto.updatedAt).toLocaleString("pt-BR")}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
