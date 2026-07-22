"use client"

import { useEffect, useMemo, useState } from "react"
import {
  FolderKanban,
  MapPin,
  Users,
  CalendarClock,
  Loader2,
  AlertCircle,
  RefreshCcw,
  Building2,
} from "lucide-react"

type Projeto = {
  id: string
  titulo?: string
  natureza?: string
  status?: string
  estadoAtual?: string
  instituicao?: string
  unidade?: string
  responsavel?: string
  parceiros?: string
  periodo?: string
  estado?: string
  territorio?: string[] | string
  municipio?: string[] | string
  beneficiarios?: string
  nmrBeneficiarios?: string | number
  investimentoReal?: string
  fonteFinanciamento?: string[] | string
  localExecucao?: string
  objetivoGeral?: string
  fotos?: string[]
  updatedAt?: string | null
}

type ApiResposta =
  | { total: number; projetos: Projeto[] }
  | { error: string; details?: string }

const COLORS = {
  cyan: "#00B5AD",
  green: "#7AC143",
  blue: "#0077C0",
  orange: "#F7941D",
  yellow: "#FDB913",
  gray: "#64748b",
}

function ListaTexto({ valor }: { valor: Projeto["territorio"] }) {
  if (!valor) return null
  if (Array.isArray(valor)) return <>{valor.join(", ")}</>
  return <>{String(valor)}</>
}

export function ProjetosSection() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("todos")

  async function carregar() {
    setError(null)
    setIsLoading(true)
    try {
      const res = await fetch(`/api/hub/projetos?ts=${Date.now()}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as ApiResposta
      if ("error" in data) throw new Error(data.error)
      setProjetos(data.projetos || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar projetos.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const statusOptions = useMemo(() => {
    const set = new Set<string>()
    projetos.forEach((p) => {
      if (p.status) set.add(p.status)
    })
    return ["todos", ...Array.from(set).sort()]
  }, [projetos])

  const projetosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return projetos.filter((p) => {
      if (filtroStatus !== "todos" && p.status !== filtroStatus) return false
      if (!termo) return true
      const campos = [
        p.titulo,
        p.instituicao,
        p.unidade,
        p.responsavel,
        p.parceiros,
        p.natureza,
        p.localExecucao,
        p.estado,
        p.beneficiarios,
        p.objetivoGeral,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return campos.includes(termo)
    })
  }, [projetos, busca, filtroStatus])

  return (
    <section id="projetos" className="relative py-24 md:py-32 overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-5 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${COLORS.cyan}, ${COLORS.blue}, transparent)`,
        }}
      />

      <div className="relative px-6 md:px-10 lg:px-16 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-white/80 px-4 py-2 text-sm font-semibold">
            <FolderKanban className="w-4 h-4 text-cyan-600" />
            Projetos SECTI
          </span>
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 mt-4"
          >
            Projetos{" "}
            <span
              style={{
                background: `linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.blue})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Cadastrados
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Acompanhamento dos projetos estratégicos da SECTI, com metas,
            indicadores e execução.
          </p>
        </div>

        {/* Controles */}
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título, instituição, responsável..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s === "todos" ? "Todos os status" : s}
              </option>
            ))}
          </select>
          <button
            onClick={carregar}
            disabled={isLoading}
            className="cursor-pointer px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: COLORS.blue }}
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>

        {/* Estados */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
            <p className="text-sm text-muted-foreground">
              Carregando projetos do SECTI...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <p className="text-sm text-muted-foreground max-w-md">{error}</p>
            <button
              onClick={carregar}
              className="cursor-pointer mt-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: COLORS.blue }}
            >
              Tentar novamente
            </button>
          </div>
        ) : projetosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <FolderKanban className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum projeto encontrado com os filtros atuais.
            </p>
          </div>
        ) : (
          <>
            {/* Contador */}
            <p className="text-sm text-muted-foreground mb-4">
              {projetosFiltrados.length} de {projetos.length} projeto(s)
            </p>

            {/* Grid de cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {projetosFiltrados.map((p, i) => (
                <ProjetoCard key={p.id} projeto={p} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function ProjetoCard({ projeto: p, index }: { projeto: Projeto; index: number }) {
  const color = COLORS.cyan
  const atualizado = p.updatedAt ? new Date(p.updatedAt) : null

  return (
    <div
      className="group relative overflow-hidden rounded-3xl bg-card border border-border transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 animate-fade-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: color }}
      />

      {/* Imagem de capa */}
      {p.fotos && p.fotos.length > 0 && (
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.fotos[0]}
            alt={p.titulo || "Foto do projeto"}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-6">
        {/* Status badge */}
        {p.status && (
          <div className="flex items-center gap-2 mb-3">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: `${COLORS.green}20`,
                color: COLORS.green,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: COLORS.green }}
              />
              {p.status}
            </span>
            {p.estadoAtual && (
              <span className="text-xs text-muted-foreground">
                {p.estadoAtual}
              </span>
            )}
          </div>
        )}

        {/* Título */}
        <h3 className="text-lg font-bold mb-2 line-clamp-2">
          {p.titulo || "(sem título)"}
        </h3>

        {/* Natureza / Instituição */}
        {(p.natureza || p.instituicao) && (
          <p className="text-sm text-muted-foreground mb-3">
            {[p.natureza, p.instituicao].filter(Boolean).join(" · ")}
          </p>
        )}

        {/* Objetivo */}
        {p.objetivoGeral && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {p.objetivoGeral}
          </p>
        )}

        {/* Metadados */}
        <div className="space-y-2 text-xs text-muted-foreground mb-4">
          {p.responsavel && (
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{p.responsavel}</span>
            </div>
          )}
          {(p.municipio || p.estado || p.localExecucao) && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                <ListaTexto valor={p.municipio} />
                {p.municipio && (p.estado || p.localExecucao) ? " · " : ""}
                {[p.estado, p.localExecucao].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
          {(p.instituicao || p.unidade) && (
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                {[p.instituicao, p.unidade].filter(Boolean).join(" · ")}
              </span>
            </div>
          )}
          {atualizado && (
            <div className="flex items-center gap-2">
              <CalendarClock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                Atualizado em{" "}
                {atualizado.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Indicadores */}
        {(p.beneficiarios || p.nmrBeneficiarios || p.investimentoReal) && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
            {p.nmrBeneficiarios != null && p.nmrBeneficiarios !== "" && (
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-medium"
                style={{ backgroundColor: `${COLORS.orange}15`, color: COLORS.orange }}
              >
                {String(p.nmrBeneficiarios)} beneficiários
              </span>
            )}
            {p.investimentoReal && (
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-medium"
                style={{ backgroundColor: `${COLORS.green}15`, color: COLORS.green }}
              >
                Investimento
              </span>
            )}
            {p.periodo && (
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-medium"
                style={{ backgroundColor: `${COLORS.blue}15`, color: COLORS.blue }}
              >
                {p.periodo}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
