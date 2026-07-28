import type { MetricKey } from "./mapa-types"
export type { MetricKey }

export type MetricaInfo = {
  key: MetricKey
  label: string
  unit: string
  description: string
  icon: "target" | "check-circle" | "clock" | "wifi" | "building" | "cpu" | "flask" | "layers" | "factory" | "rocket"
  color: string
}

export const METRICAS_DISPONIVEIS: MetricaInfo[] = [
  {
    key: "totalProjetos",
    label: "Projetos",
    unit: "projetos",
    description: "Total de projetos da SECTI neste território",
    icon: "target",
    color: "#6366f1",
  },
  {
    key: "projetosConcluidos",
    label: "Concluídos",
    unit: "concluídos",
    description: "Projetos finalizados com sucesso",
    icon: "check-circle",
    color: "#10b981",
  },
  {
    key: "projetosAndamento",
    label: "Em Andamento",
    unit: "andamento",
    description: "Projetos em execução atualmente",
    icon: "clock",
    color: "#f59e0b",
  },
  {
    key: "municipiosConectados",
    label: "Municípios Conectados",
    unit: "municípios",
    description: "Municípios com ao menos 1 praça Conecta instalada",
    icon: "wifi",
    color: "#0ea5e9",
  },
  {
    key: "installedPoints",
    label: "Praças Instaladas",
    unit: "praças",
    description: "Total de praças Conecta já instaladas",
    icon: "building",
    color: "#8b5cf6",
  },
  {
    key: "icts",
    label: "ICTs",
    unit: "icts",
    description: "Instituições de Ciência e Tecnologia presentes no território",
    icon: "cpu",
    color: "#ec4899",
  },
  {
    key: "centrosPesquisa",
    label: "Centros de Pesquisa",
    unit: "centros",
    description: "Centros de pesquisa instalados no território",
    icon: "flask",
    color: "#14b8a6",
  },
  {
    key: "espacoDinamizadoress",
    label: "Espaços Dinamizadores",
    unit: "espaços",
    description: "Espaços dinamizadores de inovação e tecnologia",
    icon: "layers",
    color: "#f97316",
  },
  {
    key: "parquesTecnologicos",
    label: "Parques Tecnológicos",
    unit: "parques",
    description: "Parques tecnológicos instalados no território",
    icon: "factory",
    color: "#84cc16",
  },
  {
    key: "incubadorasAceleradoras",
    label: "Incubadoras & Aceleradoras",
    unit: "incubadoras",
    description: "Incubadoras e aceleradoras de startups e negócios inovadores",
    icon: "rocket",
    color: "#06b6d4",
  },
]

export const METRICA_ICONS: Record<string, React.ReactNode> = {}
