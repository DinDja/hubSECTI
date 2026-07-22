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
                <ProjetoCard key={p.id} projeto={p} index={i} />
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
    </section>
  )
}

function ProjetoCard({ projeto: p, index }: { projeto: Projeto; index: number }) {
  const [imgError, setImgError] = useState(false)
  const fotoUrl = p.fotos?.[0]
  const hasFoto = !!fotoUrl && !imgError
  const atualizado = p.updatedAt ? new Date(p.updatedAt) : null

  return (
    <div className="group relative overflow-hidden rounded-3xl bg-card border border-border transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 animate-fade-in"
      style={{ animationDelay: `${index * 80}ms` }}>

      {/* Thumbnail */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-cyan-50 to-blue-50">
        {hasFoto ? (
          <img src={fotoUrl} alt={p.titulo || "Projeto"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FolderKanban className="w-12 h-12 text-cyan-200" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Status badge */}
        {p.status && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.green }} />
              {p.status}
            </span>
          </div>
        )}

        {/* Natureza badge */}
        {p.natureza && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/80 backdrop-blur-sm text-muted-foreground shadow-sm">
              {p.natureza}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-base font-bold mb-1.5 line-clamp-2 leading-snug group-hover:text-cyan-700 transition-colors">
          {p.titulo || "(sem título)"}
        </h3>

        {(p.instituicao || p.unidade) && (
          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
            <Building2 className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{[p.instituicao, p.unidade].filter(Boolean).join(" · ")}</span>
          </p>
        )}

        {p.objetivoGeral && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{p.objetivoGeral}</p>
        )}

        <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
          {p.responsavel && (
            <div className="flex items-center gap-1.5">
              <Users className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{p.responsavel}</span>
            </div>
          )}
          {(p.municipio || p.estado) && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                <ListaTexto valor={p.municipio} />
                {p.municipio && p.estado ? " · " : ""}{p.estado}
              </span>
            </div>
          )}
          {atualizado && (
            <div className="flex items-center gap-1.5">
              <CalendarClock className="w-3 h-3 flex-shrink-0" />
              <span>Atualizado em {atualizado.toLocaleDateString("pt-BR", {
                day: "2-digit", month: "2-digit", year: "numeric"
              })}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {(p.nmrBeneficiarios || p.investimentoReal || p.periodo) && (
          <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border">
            {p.nmrBeneficiarios != null && p.nmrBeneficiarios !== "" && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium" style={{ backgroundColor: `${COLORS.orange}15`, color: COLORS.orange }}>
                {formatter.format(Number(p.nmrBeneficiarios))} beneficiário{Number(p.nmrBeneficiarios) !== 1 ? "s" : ""}
              </span>
            )}
            {p.investimentoReal && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium" style={{ backgroundColor: `${COLORS.green}15`, color: COLORS.green }}>
                Investimento
              </span>
            )}
            {p.periodo && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium" style={{ backgroundColor: `${COLORS.blue}15`, color: COLORS.blue }}>
                {p.periodo}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
