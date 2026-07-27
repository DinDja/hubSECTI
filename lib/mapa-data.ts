import type { MetricKey } from "./mapa-types"
export type { MetricKey }

export const METRICAS_DISPONIVEIS: { key: MetricKey; label: string; unit: string }[] = [
  { key: "totalProjetos", label: "Projetos", unit: "projetos" },
  { key: "projetosConcluidos", label: "Projetos Concluídos", unit: "concluídos" },
  { key: "projetosAndamento", label: "Projetos em Andamento", unit: "em andamento" },
  { key: "municipiosConectados", label: "Municípios com Conecta", unit: "municípios" },
  { key: "installedPoints", label: "Praças Instaladas", unit: "praças" },
]
