"use client"

import { useEffect, useState } from "react"
import { MapaSection } from "@/components/mapa-section"
import { agregarMetricasTerritorios, type MetricasExternas } from "@/lib/agregar-metricas"
import { agregarCtiTerritorios } from "@/lib/agregar-cti"
import type { ConectaData } from "@/lib/mapa-types"
import { simplifyMunicipioName } from "@/lib/conecta-coverage"
import { CONECTA_REFERENCE_TOTALS } from "@/lib/conecta-reference"
import { cachedFetch } from "@/lib/cache-db"
import territoriosData from "@/lib/territorioMunicipios.json"

const PROJETOS_TTL_MS = 5 * 60 * 1000
const CONECTA_TTL_MS = 5 * 60 * 1000

type ProjetosApiResponse = {
  projetos?: Array<{ titulo?: string; status?: string; territorio?: string[] | string }>
}

const normalize = (s: string): string =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()

const MUNICIPIO_TERRITORIO_MAP = new Map<string, string>()
for (const t of territoriosData.territorios_de_identidade) {
  const tn = normalize(t.nome)
  for (const m of t.municipios) {
    MUNICIPIO_TERRITORIO_MAP.set(simplifyMunicipioName(m), tn)
  }
}

function agregarConectaTerritorios(
  conectaData: ConectaData | undefined,
  metricas: MetricasExternas,
): MetricasExternas {
  if (!conectaData) return metricas
  const result: MetricasExternas = { ...metricas }

  const terrConecta = new Map<string, { municipiosConectados: number; installedPoints: number }>()

  for (const [municipio, pracas] of Object.entries(conectaData)) {
    const rows = Array.isArray(pracas) ? pracas : []
    const installedRows = rows.filter(
      (r: any) =>
        !r || String(r?.status_instalacao || "").trim().toLowerCase() === "instalado",
    )
    if (installedRows.length === 0) continue

    const normMun = simplifyMunicipioName(municipio)
    if (!normMun) continue

    const tn = MUNICIPIO_TERRITORIO_MAP.get(normMun)
    if (!tn) continue

    if (!terrConecta.has(tn)) {
      terrConecta.set(tn, { municipiosConectados: 0, installedPoints: 0 })
    }
    const entry = terrConecta.get(tn)!
    entry.municipiosConectados++
    entry.installedPoints += installedRows.length
  }

  for (const [tn, vals] of terrConecta) {
    if (!result[tn]) result[tn] = {}
    result[tn].municipiosConectados = vals.municipiosConectados
    result[tn].installedPoints = vals.installedPoints
  }

  return result
}

function preencherValoresReferencia(metricas: MetricasExternas): MetricasExternas {
  const totalMunicipiosBahia = territoriosData.territorios_de_identidade.reduce(
    (sum, t) => sum + (t.quantidade_municipios || t.municipios.length),
    0,
  )

  const result: MetricasExternas = { ...metricas }
  for (const tn of Object.keys(result)) {
    if (result[tn].municipiosConectados === undefined) {
      const tOrig = territoriosData.territorios_de_identidade.find(
        (t) => normalize(t.nome) === tn,
      )
      const munCount = tOrig?.quantidade_municipios || tOrig?.municipios.length || 1
      const ratio = totalMunicipiosBahia > 0 ? munCount / totalMunicipiosBahia : 0
      result[tn].municipiosConectados = Math.max(
        1,
        Math.round(CONECTA_REFERENCE_TOTALS.municipalitiesCount * ratio),
      )
      result[tn].installedPoints = Math.max(
        0,
        Math.round(CONECTA_REFERENCE_TOTALS.installedPointsCount * ratio),
      )
    }
  }
  return result
}

export function MapaSectionLoader() {
  const [metricas, setMetricas] = useState<MetricasExternas | undefined>(undefined)
  const [conecta, setConecta] = useState<ConectaData | undefined>(undefined)

  useEffect(() => {
    let active = true

    async function load() {
      const [projetosRes, conectaRes] = await Promise.allSettled([
        cachedFetch<ProjetosApiResponse>(
          "/api/hub/projetos?limit=50&offset=0",
          "mapa-projetos",
          PROJETOS_TTL_MS,
        ),
        cachedFetch<ConectaData>(
          "/api/hub/conecta",
          "mapa-conecta",
          CONECTA_TTL_MS,
        ).catch(() => undefined),
      ])

      if (!active) return

      let metricasExternas: MetricasExternas = {}

      if (projetosRes.status === "fulfilled" && projetosRes.value?.projetos?.length) {
        metricasExternas = agregarMetricasTerritorios(projetosRes.value.projetos as any)
      }

      const conectaData =
        conectaRes.status === "fulfilled" ? conectaRes.value : undefined
      if (conectaData) {
        setConecta(conectaData)
        metricasExternas = agregarConectaTerritorios(conectaData, metricasExternas)
      }

      // Merge CTI data (ICTs, Centros de Pesquisa, etc.)
      const cti = agregarCtiTerritorios()
      for (const [key, vals] of Object.entries(cti)) {
        if (!metricasExternas[key]) metricasExternas[key] = {}
        Object.assign(metricasExternas[key], vals)
      }

      if (Object.keys(metricasExternas).length > 0) {
        metricasExternas = preencherValoresReferencia(metricasExternas)
        setMetricas(metricasExternas)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  return <MapaSection metricasExternas={metricas} conectaData={conecta} />
}
