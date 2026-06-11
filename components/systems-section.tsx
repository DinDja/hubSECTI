"use client"

import { useState } from "react"
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
  Database
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
    title: "SECTISPEAK",
    description: "Plataforma de comunicação e voz para iniciativas de inclusão digital e participação cidadã.",
    url: "https://cloudspeak.netlify.app/",
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
    url: "https://patenteslab.secti.ba.gov.br/",
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
  { id: "gestao", label: "Gestao", color: colors.cyan },
  { id: "dados", label: "Dados", color: colors.green },
  { id: "pesquisa", label: "Pesquisa", color: colors.magenta },
  { id: "comunicacao", label: "Comunicação", color: colors.yellow },
]

export function SystemsSection() {
  const [activeCategory, setActiveCategory] = useState("todos")

  const filteredSystems = activeCategory === "todos" 
    ? systems 
    : systems.filter(s => s.category === activeCategory)

  return (
    <section id="sistemas" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-5 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${colors.blue}, ${colors.cyan}, transparent)` }}
      />

      <div className="relative px-6 md:px-10 lg:px-16 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            Nossos{" "}
            <span 
              style={{
                background: `linear-gradient(135deg, ${colors.cyan}, ${colors.blue})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Sistemas
            </span>
          </h2>
          
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Ferramentas digitais desenvolvidas para modernizar a gestão pública 
            e ampliar o acesso à informação no estado da Bahia.
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`cursor-pointer px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeCategory === cat.id
                  ? "text-white shadow-lg scale-105"
                  : "bg-muted hover:bg-muted/80"
              }`}
              style={{
                backgroundColor: activeCategory === cat.id ? cat.color : undefined,
                boxShadow: activeCategory === cat.id ? `0 10px 30px -10px ${cat.color}` : undefined,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Systems grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filteredSystems.map((system, index) => (
            <SystemCard
              key={system.title}
              {...system}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
