"use client"

import { useEffect, useState } from "react"
import { MapPinned, Network, RadioTower, RefreshCcw } from "lucide-react"
import { CONECTA_REFERENCE_TOTALS } from "@/lib/conecta-reference"

type ConectaSummaryApiResponse = {
  summary?: {
    municipalitiesCount?: number
    territoriesCount?: number
    installedPointsCount?: number
  }
}

const numberFormatter = new Intl.NumberFormat("pt-BR")

export function HubIntegracoesSection() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalMunicipiosConecta, setTotalMunicipiosConecta] = useState<number>(CONECTA_REFERENCE_TOTALS.municipalitiesCount)
  const [totalTerritoriosConecta, setTotalTerritoriosConecta] = useState<number>(CONECTA_REFERENCE_TOTALS.territoriesCount)
  const [totalPracasConecta, setTotalPracasConecta] = useState<number>(CONECTA_REFERENCE_TOTALS.installedPointsCount)

  useEffect(() => {
    let active = true

    async function loadData() {
      setError(null)
      setIsLoading(true)

      try {
        const conectaRes = await fetch(`/api/hub/conecta-resumo?nocache=true&ts=${Date.now()}`, {
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        })

        if (!conectaRes.ok) {
          throw new Error(`Falha ao carregar dados do Conecta Bahia (HTTP ${conectaRes.status}).`)
        }

        const conectaData = (await conectaRes.json()) as ConectaSummaryApiResponse
        const summary = conectaData.summary

        if (!active) return

        if (Number(summary?.municipalitiesCount || 0) > 0) {
          setTotalMunicipiosConecta(Number(summary?.municipalitiesCount))
        }

        if (Number(summary?.territoriesCount || 0) > 0) {
          setTotalTerritoriosConecta(Number(summary?.territoriesCount))
        }

        if (Number(summary?.installedPointsCount || 0) > 0) {
          setTotalPracasConecta(Number(summary?.installedPointsCount))
        }
      } catch (err) {
        if (!active) return

        setError(err instanceof Error ? err.message : "Nao foi possivel integrar os dados externos.")
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [])

  return (
    <section id="integracoes" className="relative py-15 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            "radial-gradient(90% 70% at 70% 20%, rgba(0,119,192,0.15), transparent 70%), radial-gradient(60% 60% at 20% 80%, rgba(122,193,67,0.14), transparent 72%)",
        }}
      />

      <div className="relative px-6 md:px-10 lg:px-16 max-w-[1600px] mx-auto">
        <div className="flex flex-col gap-4 md:gap-5 mb-10 md:mb-12">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-white/80 px-4 py-2 text-sm font-semibold">
            <Network className="w-4 h-4 text-cyan-600" />
            HUB Integrado
          </span>

          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight max-w-4xl">Dados unificados</h2>

          <p className="text-muted-foreground max-w-3xl text-base md:text-lg leading-relaxed">
            Esta area conecta no HUB as fontes que estavam separadas: painel territorial e painel Conecta Bahia.
          </p>

          <p className="text-sm text-muted-foreground max-w-3xl">
            {isLoading
              ? "Carregando indicadores validados do Conecta Bahia..."
              : error
                ? "Nao foi possivel validar a fonte agora, mantendo os totais de referencia do Conecta Bahia."
                : "Indicadores exibindo os totais de referencia validados do Conecta Bahia."}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-border/70 bg-white/90 p-4 md:p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-2">
              <MapPinned className="w-4 h-4 text-blue-600" />
              Territorios Conecta
            </div>
            <p className="text-2xl md:text-3xl font-black">{numberFormatter.format(totalTerritoriosConecta)}</p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-white/90 p-4 md:p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-2">
              <RadioTower className="w-4 h-4 text-green-600" />
              Municipios Conecta
            </div>
            <p className="text-2xl md:text-3xl font-black">{numberFormatter.format(totalMunicipiosConecta)}</p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-white/90 p-4 md:p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-2">
              <RefreshCcw className="w-4 h-4 text-orange-500" />
              Pracas Instaladas
            </div>
            <p className="text-2xl md:text-3xl font-black">{numberFormatter.format(totalPracasConecta)}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
