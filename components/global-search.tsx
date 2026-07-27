"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Search,
  MapPin,
  LayoutGrid,
  Newspaper,
  Lightbulb,
  Target,
  Loader2,
  ExternalLink,
} from "lucide-react"
import { allEntries } from "@/lib/chatbot-knowledge"
import territoriosData from "@/lib/territorioMunicipios.json"

function safeStr(v: unknown): string {
  if (v == null) return ""
  if (Array.isArray(v)) return v.filter(Boolean).join(" ")
  return String(v)
}

function safeLower(v: unknown): string {
  return safeStr(v).toLowerCase()
}

type ProjetoRaw = {
  id: string
  titulo?: unknown
  status?: unknown
  territorio?: unknown
  natureza?: unknown
  instituicao?: unknown
  unidade?: unknown
  responsavel?: unknown
  objetivoGeral?: unknown
}

type NoticiaRaw = {
  title?: string
  description?: string
  href?: string
  date?: string
  preview?: { title?: string; description?: string; url?: string }
}

type SearchResult = {
  id: string
  title: string
  description: string
  category: "projetos" | "territorios" | "sistemas" | "noticias" | "conhecimento"
  action: () => void
  icon: React.ReactNode
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [projetos, setProjetos] = useState<ProjetoRaw[]>([])
  const [noticias, setNoticias] = useState<NoticiaRaw[]>([])
  const [loading, setLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const fetchedRef = useRef(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    const onCustom = () => setOpen(true)
    document.addEventListener("keydown", down)
    window.addEventListener("open-global-search", onCustom)
    return () => {
      document.removeEventListener("keydown", down)
      window.removeEventListener("open-global-search", onCustom)
    }
  }, [])

  useEffect(() => {
    if (open && !fetchedRef.current) {
      fetchedRef.current = true
      setLoading(true)
      Promise.allSettled([
        fetch("/api/hub/projetos?limit=50&offset=0")
          .then((r) => r.ok ? r.json() : Promise.reject())
          .then((d: any) => setProjetos((d.projetos || []) as ProjetoRaw[])),
        fetch("/api/hub/noticias?limit=5")
          .then((r) => r.ok ? r.json() : Promise.reject())
          .then((d: any) => setNoticias((d.items || []) as NoticiaRaw[])),
      ]).finally(() => { setLoading(false); setDataLoaded(true) })
    }
  }, [open])

  const scrollTo = useCallback((id: string) => {
    setOpen(false)
    setTimeout(() => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 150)
  }, [])

  const results = useCallback((): SearchResult[] => {
    const q = query.toLowerCase().trim()
    if (!q || q.length < 2) return []

    const out: SearchResult[] = []

    // Projects
    for (const p of projetos) {
      const titulo = safeLower(p.titulo)
      const territorio = safeLower(p.territorio)
      const natureza = safeLower(p.natureza)
      const instituicao = safeLower(p.instituicao)
      const responsavel = safeLower(p.responsavel)

      const searchable = [titulo, territorio, natureza, instituicao, responsavel].join(" ")
      if (!searchable.includes(q)) continue

      const descParts = [safeStr(p.natureza), safeStr(p.status), safeStr(p.territorio)].filter(Boolean)
      out.push({
        id: `proj-${p.id}`,
        title: safeStr(p.titulo) || "Sem título",
        description: descParts.join(" · ") || "Projeto SECTI",
        category: "projetos",
        action: () => scrollTo("projetos"),
        icon: <Target size={16} className="text-blue-500" />,
      })
    }

    // Territories
    for (const t of territoriosData.territorios_de_identidade) {
      const nome = t.nome.toLowerCase()
      const munMatch = t.municipios.filter((m) => m.toLowerCase().includes(q))
      if (!nome.includes(q) && munMatch.length === 0) continue

      out.push({
        id: `terr-${t.id}`,
        title: nome.includes(q) ? t.nome : `${t.nome} (${munMatch.length} municípios)`,
        description: `${t.quantidade_municipios || t.municipios.length} municípios`,
        category: "territorios",
        action: () => scrollTo("mapa"),
        icon: <MapPin size={16} className="text-emerald-500" />,
      })
    }

    // Systems
    const systems = allEntries.filter((e) => e.category === "sistemas")
    for (const s of systems) {
      const kwMatch = s.keywords.some((kw) => kw.includes(q))
      if (!s.title.toLowerCase().includes(q) && !kwMatch && !s.content.toLowerCase().includes(q)) continue
      out.push({
        id: `sys-${s.id}`,
        title: s.title,
        description: s.content.substring(0, 100),
        category: "sistemas",
        action: () => scrollTo("sistemas"),
        icon: <LayoutGrid size={16} className="text-purple-500" />,
      })
    }

    // Knowledge
    for (const e of allEntries) {
      if (e.category === "sistemas") continue
      const kwMatch = e.keywords.some((kw) => kw.includes(q))
      if (!e.title.toLowerCase().includes(q) && !kwMatch && !e.content.toLowerCase().includes(q)) continue
      out.push({
        id: `know-${e.id}`,
        title: e.title,
        description: e.content.substring(0, 120),
        category: "conhecimento",
        action: () => {
          setOpen(false)
          if (e.links?.[0]?.url) window.open(e.links[0].url, "_blank")
        },
        icon: <Lightbulb size={16} className="text-amber-500" />,
      })
    }

    // News
    for (const n of noticias) {
      const title = safeLower(n.title || n.preview?.title)
      const desc = safeLower(n.description || n.preview?.description)
      if (!title.includes(q) && !desc.includes(q)) continue

      out.push({
        id: `news-${n.href || n.preview?.url || Math.random().toString(36)}`,
        title: n.title || n.preview?.title || "Notícia",
        description: (n.description || n.preview?.description || "").substring(0, 120),
        category: "noticias",
        action: () => { setOpen(false); const link = n.href || n.preview?.url; if (link) window.open(link, "_blank") },
        icon: <Newspaper size={16} className="text-red-500" />,
      })
    }

    return out.slice(0, 20)
  }, [query, projetos, noticias, scrollTo])

  const resultList = results()
  const groupCounts: Record<string, number> = {}
  for (const r of resultList) {
    groupCounts[r.category] = (groupCounts[r.category] || 0) + 1
  }

  const categoryLabels: Record<string, string> = {
    projetos: "Projetos",
    territorios: "Territórios",
    sistemas: "Sistemas",
    noticias: "Notícias",
    conhecimento: "Conhecimento",
  }

  const categoryIcons: Record<string, React.ReactNode> = {
    projetos: <Target size={14} />,
    territorios: <MapPin size={14} />,
    sistemas: <LayoutGrid size={14} />,
    noticias: <Newspaper size={14} />,
    conhecimento: <Lightbulb size={14} />,
  }

  return (
    <>
      <button
        onClick={() => {
          fetchedRef.current = false
          setOpen(true)
        }}
        className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-md border border-border bg-background shadow-sm hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        title="Busca global (Ctrl+K)"
      >
        <Search size={16} />
        <span className="hidden lg:inline">Buscar...</span>
        <kbd className="hidden md:inline-flex ml-2 items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono rounded border bg-muted text-muted-foreground">
          <span className="text-[9px]">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Busca Global" description="Pesquise por projetos, municípios, territórios, sistemas e notícias">
        <CommandInput
          placeholder="Buscar no Hub SECTI..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && !dataLoaded && (
            <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              <span>Carregando dados...</span>
            </div>
          )}

          {dataLoaded && query.length >= 2 && resultList.length === 0 && (
            <CommandEmpty>
              <div className="flex flex-col items-center gap-2 py-6">
                <Search size={24} className="text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Nenhum resultado para &ldquo;{query}&rdquo;</p>
                <p className="text-[11px] text-muted-foreground/60">Tente buscar por projetos, municípios ou sistemas</p>
              </div>
            </CommandEmpty>
          )}

          {dataLoaded && resultList.length > 0 &&
            Object.entries(groupCounts).map(([cat, count]) => (
              <CommandGroup key={cat} heading={
                <div className="flex items-center gap-2">
                  {categoryIcons[cat]}
                  <span>{categoryLabels[cat] || cat}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground font-mono">{count}</span>
                </div>
              }>
                {resultList.filter((r) => r.category === cat).map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.title} ${item.description} ${item.category}`}
                    onSelect={() => item.action()}
                    className="cursor-pointer"
                  >
                    {item.icon}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{item.description}</p>
                    </div>
                    {item.category === "noticias" && <ExternalLink size={12} className="shrink-0 text-muted-foreground/40" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))
          }

          {query.length < 2 && dataLoaded && (
            <div className="py-8 px-4 text-center">
              <Search size={32} className="mx-auto text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground mb-1">Digite ao menos 2 caracteres para buscar</p>
              <p className="text-[11px] text-muted-foreground/60">
                Pesquise por projetos, municípios, territórios, sistemas e notícias
              </p>
              <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-muted-foreground/40">
                <span className="px-2 py-1 rounded border border-border bg-muted">↑↓</span>
                <span>navegar</span>
                <span className="px-2 py-1 rounded border border-border bg-muted">↵</span>
                <span>selecionar</span>
                <span className="px-2 py-1 rounded border border-border bg-muted">Esc</span>
                <span>fechar</span>
              </div>
            </div>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
