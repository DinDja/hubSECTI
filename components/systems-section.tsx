"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { SystemCard } from "./system-card"
import {
  FolderKanban,
  FileText,
  Map,
  GraduationCap,
  Building2,
  BarChart3,
  Sparkles,
  Globe,
  Users,
  Database,
} from "lucide-react"

const colors = {
  green: "#7AC143",
  cyan: "#00B5AD",
  orange: "#F7941D",
  blue: "#0077C0",
  red: "#ED1C24",
  yellow: "#FDB913",
  magenta: "#EC008C",
}

const systems = [
  {
    title: "Gestão de Projetos",
    description: "Plataforma de gestão e acompanhamento de projetos estratégicos da secretaria, com metas e indicadores integrados.",
    url: "https://secti.netlify.app",
    icon: FolderKanban,
    color: colors.cyan,
    category: "gestao",
  },
  {
    title: "Gestão de Contratos",
    description: "Ferramenta para controle de contratos, prazos e execução contratual da SECTI.",
    url: "https://secti-contratos.netlify.app/",
    icon: FileText,
    color: colors.magenta,
    category: "gestao",
  },
  {
    title: "Sistema de Inventários SECTI",
    description: "Gestão de inventário integrado para os ativos, materiais e recursos da secretaria.",
    url: "https://sectinventario.netlify.app/",
    icon: FolderKanban,
    color: colors.blue,
    category: "gestao",
  },
  {
    title: "Painel Conecta Bahia",
    description: "Painel de visualização e monitoramento dos projetos de conectividade em toda a Bahia.",
    url: "https://conectabahia.secti.ba.gov.br",
    icon: Map,
    color: colors.green,
    category: "dados",
  },
  {
    title: "Observatório de CT&I",
    description: "Dashboard que reúne dados e análises sobre ciência, tecnologia e inovação no estado.",
    url: "https://simcc.uesc.br/observatorio",
    icon: GraduationCap,
    color: colors.blue,
    category: "pesquisa",
  },
  {
    title: "Mapeamento EPT",
    description: "Sistema de mapeamento de escolas públicas técnicas e políticas educacionais do estado.",
    url: "https://mapfilterdemo.netlify.app/",
    icon: BarChart3,
    color: colors.yellow,
    category: "dados",
  },
  {
    title: "Leitura Integral de Projetos",
    description: "Ambiente para leitura, análise e gestão de projetos apoiados pela secretaria.",
    url: "https://projetosclubes.netlify.app/",
    icon: Sparkles,
    color: colors.orange,
    category: "gestao",
  },
  {
    title: "Fala SECTI",
    description: "Plataforma de comunicação e voz para iniciativas de inclusão digital e participação cidadã. Agora com login obrigatório para criar apresentações e modelos prontos editáveis de apresentações interativas.",
    url: "https://falasecti.netlify.app",
    icon: Globe,
    color: colors.red,
    category: "comunicacao",
  },
  {
    title: "Espaços Dinamizadores",
    description: "Plataforma para fomentar a colaboração e o intercâmbio de ideias entre os atores do ecossistema de inovação.",
    url: "http://espacodinamizador.secti.ba.gov.br/",
    icon: Users,
    color: colors.red,
    category: "comunicacao",
  },
  {
    title: "Painel SECTI Territórios",
    description: "Sistema de auxílio à solicitação de patentes.",
    url: "https://secti-territorios.netlify.app/",
    icon: Building2,
    color: colors.blue,
    category: "dados",
  },
  {
    title: "Conecta Clube",
    description: "O Conecta Clube é uma plataforma web para apoiar a gestão e visibilidade de projetos científicos nas escolas públicas estaduais e municipais da Bahia. Reúne num só lugar: feed colaborativo de projetos, perfis de clubes, diário de bordo, biblioteca de domínio público, fórum de discussão, agenda de eventos, trilha pedagógica e um conjunto de ferramentas de apoio ao processo de registro de propriedade intelectual no INPI.",
    url: "https://conectaclubes.secti.ba.gov.br/",
    icon: GraduationCap,
    color: colors.green,
    category: "pesquisa",
  },
  {
    title: "Busca de Patentes",
    description: "Plataforma para pesquisa e consulta de patentes, promovendo o acesso à informação tecnológica e incentivando a inovação.",
    url: "https://patentes-search.vercel.app/",
    icon: Sparkles,
    color: colors.orange,
    category: "pesquisa",
  },
  {
    title: "PatentesLab SECTI",
    description: "Portal de dados abertos da SECTI, com conjuntos de dados sobre projetos, investimentos e indicadores de CT&I.",
    url: "https://patenteslab.secti.ba.gov.br/",
    icon: Database,
    color: colors.blue,
    category: "dados",
  },
]

const categories = [
  { id: "todos", label: "Todos", color: colors.blue },
  { id: "gestao", label: "Gestão", color: colors.cyan },
  { id: "dados", label: "Dados", color: colors.green },
  { id: "pesquisa", label: "Pesquisa", color: colors.magenta },
  { id: "comunicacao", label: "Comunicação", color: colors.yellow },
]

const categoryLabels: Record<string, string> = Object.fromEntries(
  categories.map((cat) => [cat.id, cat.label])
)

export function SystemsSection() {
  const [activeCategory, setActiveCategory] = useState("todos")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredSystems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return systems.filter((system) => {
      const matchesCategory = activeCategory === "todos" || system.category === activeCategory
      const matchesSearch =
        !query ||
        system.title.toLowerCase().includes(query) ||
        system.description.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery])

  return (
    <section id="sistemas" className="py-24 md:py-32">
      <div className="px-6 md:px-10 lg:px-16 max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="flex flex-col gap-6 border-b border-border pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Plataformas
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              Sistemas{" "}
              <span className="font-normal text-muted-foreground/50">
                ({systems.length})
              </span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground md:text-base">
            Ferramentas digitais desenvolvidas para modernizar a gestão pública
            e ampliar o acesso à informação no estado da Bahia.
          </p>
        </header>

        {/* Controls */}
        <div className="mt-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          {/* Category filters */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex cursor-pointer items-center gap-2 text-sm transition-colors duration-200 ${
                    isActive
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span
                    className="h-1.5 w-1.5 transition-opacity"
                    style={{
                      backgroundColor: cat.color,
                      opacity: isActive ? 1 : 0.35,
                    }}
                  />
                  {cat.label}
                </button>
              )
            })}
          </nav>

          {/* Search */}
          <div className="relative md:w-64">
            <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar sistema"
              className="w-full border-b border-border bg-transparent py-2 pl-6 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
            />
          </div>
        </div>

        {/* Results count */}
        <div className="mt-8 flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {filteredSystems.length}{" "}
            {filteredSystems.length === 1 ? "resultado" : "resultados"}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="cursor-pointer text-xs font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
            >
              Limpar busca
            </button>
          )}
        </div>

        {/* Systems grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSystems.map((system, index) => (
            <SystemCard
              key={system.title}
              {...system}
              index={index}
              tag={categoryLabels[system.category]}
            />
          ))}
        </div>

        {/* Empty state */}
        {filteredSystems.length === 0 && (
          <div className="mt-16 border-t border-border pt-10">
            <p className="text-base font-semibold">Nenhum sistema encontrado</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Tente ajustar os filtros ou o termo de busca.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
