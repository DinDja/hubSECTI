import * as topojson from "topojson-client"
import territoriosData from "@/lib/territorioMunicipios.json"
import type { MetricKey, MunicipioRender, TerritorioInfo } from "./mapa-types"

const SVG_W = 1000
const SVG_H = 1000
const PADDING = 20

export const TERRITORY_COLORS = [
  "#EE2F5A","#FBA751","#CFDD90","#0397DA","#9CD3AF","#EB278F","#BE4481",
  "#BF8057","#D7CB76","#04AFED","#b6b317","#099D9E","#F38735","#A4C757",
  "#9493B5","#01A859","#5CC3D4","#0F9296","#FFCD37","#9F637C","#FDF588",
  "#F8AFAD","#47887A","#D9CB72","#B0BD77","#C5C7DB","#C8C6C4",
]

const normalize = (s: string): string =>
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, "").trim()

function buildPaths(topology: { objects: Record<string, unknown> }) {
  const geojson = topojson.feature(topology as any, topology.objects.BA as any) as any
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity
  for (const f of geojson.features) {
    if (!f.geometry) continue
    const rings = f.geometry.type === "Polygon" ? f.geometry.coordinates : f.geometry.coordinates.flat(1)
    for (const ring of rings) {
      for (const [lon, lat] of ring) {
        if (lon < minLon) minLon = lon; if (lon > maxLon) maxLon = lon
        if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat
      }
    }
  }

  const rangeX = maxLon - minLon
  const rangeY = maxLat - minLat
  const drawW = SVG_W - 2 * PADDING
  const drawH = SVG_H - 2 * PADDING

  const project = ([lon, lat]: [number, number]) => [
    PADDING + ((lon - minLon) / rangeX) * drawW,
    PADDING + ((maxLat - lat) / rangeY) * drawH,
  ] as [number, number]

  return geojson.features.filter((f: any) => f.geometry).map((f: any) => {
    const rings = f.geometry.type === "Polygon" ? f.geometry.coordinates : f.geometry.coordinates.flat(1)
    let sumX = 0, sumY = 0, count = 0
    const d = rings.map((ring: [number, number][]) =>
      ring.map(([lon, lat], i) => {
        const [x, y] = project([lon, lat])
        sumX += x; sumY += y; count++
        return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`
      }).join(" ") + " Z"
    ).join(" ")

    return {
      nome: f.properties.NOME,
      geocodigo: f.properties.GEOCODIGO,
      d,
      labelPos: { x: sumX / count, y: sumY / count },
      territorioId: 0,
      cor: "#e2e8f0",
    }
  })
}

export async function carregarMapa(
  metricasExternas?: Record<string, Partial<Record<MetricKey, number>>>,
): Promise<{ municipios: MunicipioRender[]; territorios: TerritorioInfo[] }> {
  const topoRes = await fetch("/BA_(1)9396399957704198.json")
  const topology = await topoRes.json()
  const features = buildPaths(topology)
  const totalMunicipiosBahia = territoriosData.territorios_de_identidade.reduce(
    (s, t) => s + (t.quantidade_municipios || t.municipios.length), 0
  )

  const municipioTerritorioMap = new Map<string, { id: number; nome: string; cor: string }>()
  for (const t of territoriosData.territorios_de_identidade) {
    const cor = TERRITORY_COLORS[t.id - 1] || "#e2e8f0"
    for (const m of t.municipios) {
      municipioTerritorioMap.set(normalize(m), { id: t.id, nome: t.nome, cor })
    }
  }

  const municipios: MunicipioRender[] = features.map((f) => {
    const info = municipioTerritorioMap.get(normalize(f.nome))
    return {
      ...f,
      territorioId: info?.id ?? 0,
      cor: info?.cor ?? "#e2e8f0",
    }
  })

  const territorios: TerritorioInfo[] = territoriosData.territorios_de_identidade.map((t) => {
    const ext = metricasExternas?.[normalize(t.nome)] ?? {}
    return {
      id: t.id,
      nome: t.nome,
      municipios: t.municipios,
      metricas: {
        totalMunicipios: t.quantidade_municipios ?? t.municipios.length,
        municipiosConectados: ext.municipiosConectados ?? 0,
        totalProjetos: ext.totalProjetos ?? 0,
        projetosConcluidos: ext.projetosConcluidos ?? 0,
        projetosAndamento: ext.projetosAndamento ?? 0,
        installedPoints: ext.installedPoints ?? 0,
      },
    }
  })

  return { municipios, territorios }
}