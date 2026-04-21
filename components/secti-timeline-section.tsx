"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { ArrowLeft, ArrowRight, ArrowUpRight, Instagram, Globe, Loader2 } from "lucide-react"
import { buildImageProxyPath } from "@/lib/image-proxy"

type LinkPreview = {
  url: string
  title: string
  description: string
  image: string
  siteName: string
}

type TimelineEvent = {
  date: string
  title: string
  description: string
  href: string
  source: string
  preview: LinkPreview
}

type TimelineApiResponse = {
  items?: TimelineEvent[]
  fetchedAt?: string
}

const FALLBACK_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    date: "10 abr 2026",
    title: "SECTI entrega wi-fi gratuito ao Territorio da Chapada Diamantina",
    description:
      "A entrega em Seabra marcou a universalizacao do Conecta Bahia no territorio, com foco em inclusao digital e acesso a servicos publicos.",
    href: "https://www.ba.gov.br/secti/noticias/2026-04/2903/secti-entrega-wi-fi-gratuito-ao-territorio-da-chapada-diamantina",
    source: "Portal SECTI",
    preview: {
      url: "https://www.ba.gov.br/secti",
      title: "SECTI entrega wi-fi gratuito ao Territorio da Chapada Diamantina",
      description: "A entrega em Seabra marcou a universalizacao do Conecta Bahia no territorio, beneficiando milhares de cidadaos.",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
      siteName: "Portal SECTI - Governo da Bahia"
    }
  },
  {
    date: "07 abr 2026",
    title: "SECTI e Sebrae entregam mapeamento do ecossistema de inovacao de Ilheus",
    description:
      "O diagnostico identifica setores estrategicos e caminhos para fortalecer governanca, talentos e novos negocios inovadores no municipio.",
    href: "https://www.ba.gov.br/secti/noticias/2026-04/2901/secti-e-sebrae-entregam-mapeamento-para-impulsionar-ecossistema-de-inovacao",
    source: "Portal SECTI",
    preview: {
      url: "https://www.ba.gov.br/secti",
      title: "SECTI e Sebrae entregam mapeamento do ecossistema de inovacao",
      description: "Diagnostico estrategico para impulsionar o ecossistema de inovacao em Ilheus.",
      image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80",
      siteName: "Portal SECTI - Governo da Bahia"
    }
  },
  {
    date: "07 abr 2026",
    title: "Bahia realiza 1a reuniao do Comite Intersetorial PopCiencia Jovem",
    description:
      "Instancia com participacao de governo, instituicoes cientificas e sociedade civil para consolidar a politica de popularizacao da ciencia entre juventudes.",
    href: "https://www.ba.gov.br/secti/noticias/2026-04/2900/bahia-realiza-1a-reuniao-ordinaria-do-comite-intersetorial-popciencia-jovem",
    source: "Portal SECTI",
    preview: {
      url: "https://www.ba.gov.br/secti",
      title: "Comite Intersetorial PopCiencia Jovem - Primeira Reuniao",
      description: "Marco historico na politica de popularizacao da ciencia na Bahia.",
      image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80",
      siteName: "Portal SECTI - Governo da Bahia"
    }
  },
  {
    date: "06 abr 2026",
    title: "Rede Bah.IA leva letramento em IA para salas da rede publica",
    description:
      "Projeto disponibiliza material gratuito com 28 aulas e trilhas praticas para apoiar professores da educacao basica no ensino de inteligencia artificial.",
    href: "https://www.ba.gov.br/secti/noticias/2026-04/2899/rede-bahia-leva-letramento-em-inteligencia-artificial-para-salas-de-aula-da",
    source: "Portal SECTI",
    preview: {
      url: "https://www.ba.gov.br/secti",
      title: "Rede Bah.IA - Letramento em Inteligencia Artificial",
      description: "Material pedagogico gratuito com 28 aulas para capacitar professores em IA.",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
      siteName: "Portal SECTI - Governo da Bahia"
    }
  },
  {
    date: "31 mar 2026",
    title: "SECTI e CBPM inauguram hub para mineracao sustentavel",
    description:
      "O Minex Hub, primeiro do Norte e Nordeste, nasce para conectar startups, universidades e setor produtivo em desafios reais da cadeia mineral.",
    href: "https://www.ba.gov.br/secti/noticias/2026-03/2897/secti-e-cbpm-inauguram-hub-para-fortalecer-mineracao-sustentavel-na-bahia",
    source: "Portal SECTI",
    preview: {
      url: "https://www.ba.gov.br/secti",
      title: "Minex Hub - Hub de Mineracao Sustentavel",
      description: "Primeiro hub de mineracao sustentavel do Norte e Nordeste.",
      image: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&q=80",
      siteName: "Portal SECTI - Governo da Bahia"
    }
  },
  {
    date: "30 mar 2026",
    title: "SECTI e Fapesb lancam rede para negocios inovadores liderados por mulheres",
    description:
      "Encontro reuniu 52 empreendedoras dos editais Inventiva e marcou o lancamento do Inventivas Hub para conexao e desenvolvimento continuo.",
    href: "https://www.ba.gov.br/secti/noticias/2026-03/2896/secti-e-fapesb-lancam-rede-para-fortalecer-negocios-inovadores-liderados-por",
    source: "Portal SECTI",
    preview: {
      url: "https://www.ba.gov.br/secti",
      title: "Inventivas Hub - Rede de Mulheres Empreendedoras",
      description: "Lancamento da rede Inventivas Hub reunindo 52 empreendedoras.",
      image: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&q=80",
      siteName: "Portal SECTI - Governo da Bahia"
    }
  },
]

const eventColors = ["#00B5AD", "#0077C0", "#7AC143", "#F7941D", "#EC008C", "#ED1C24"]
const INITIAL_NEWS_LIMIT = 6
const NEWS_LIMIT_STEP = 6
const MAX_NEWS_LIMIT = 18
const DEFAULT_PREVIEW_IMAGE =
  "https://www.ba.gov.br/secti/modules/custom/bagov_base_blocks/assets/images/logo-governo-rodape.png"

function getPreviewHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./i, "")
  } catch {
    return "ba.gov.br"
  }
}

function normalizePreviewImageUrl(rawUrl: string) {
  const trimmed = rawUrl.trim()
  if (!trimmed) {
    return DEFAULT_PREVIEW_IMAGE
  }

  let candidate = trimmed

  if (candidate.startsWith("//")) {
    candidate = `https:${candidate}`
  } else if (candidate.startsWith("/")) {
    candidate = `https://www.ba.gov.br${candidate}`
  }

  try {
    const parsed = new URL(candidate)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return DEFAULT_PREVIEW_IMAGE
    }

    parsed.protocol = "https:"
    return parsed.toString()
  } catch {
    return DEFAULT_PREVIEW_IMAGE
  }
}

function buildImageProxyUrl(rawUrl: string) {
  const normalizedUrl = normalizePreviewImageUrl(rawUrl)
  return buildImageProxyPath(normalizedUrl)
}

function LinkPreviewCard({ preview, color }: { preview: LinkPreview; color: string }) {
  const proxyImageUrl = buildImageProxyUrl(preview.image)
  const directImageUrl = normalizePreviewImageUrl(preview.image)
  const fallbackProxyImageUrl = buildImageProxyUrl(DEFAULT_PREVIEW_IMAGE)
  const fallbackImageUrl = normalizePreviewImageUrl(DEFAULT_PREVIEW_IMAGE)

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-300 hover:shadow-md"
      style={{ boxShadow: `inset 0 0 0 1px ${color}22` }}
    >
      <div className="relative h-24 w-full flex-shrink-0 overflow-hidden bg-slate-100 md:h-28">
        <img
          src={proxyImageUrl}
          alt={preview.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={(event) => {
            const currentMode = event.currentTarget.dataset.loadMode ?? "proxy"

            if (currentMode === "proxy") {
              event.currentTarget.dataset.loadMode = "direct"
              event.currentTarget.src = directImageUrl
              return
            }

            if (currentMode === "direct") {
              event.currentTarget.dataset.loadMode = "fallback-proxy"
              event.currentTarget.src = fallbackProxyImageUrl
              return
            }

            if (currentMode === "fallback-proxy") {
              event.currentTarget.dataset.loadMode = "fallback"
              event.currentTarget.src = fallbackImageUrl
            }
          }}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-2.5">
        <div className="mb-1 flex items-center gap-1.5">
          <Globe className="h-3 w-3 text-slate-400" />
          <span className="line-clamp-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">
            {preview.siteName}
          </span>
        </div>
        <h4 className="line-clamp-2 text-[11px] font-semibold leading-tight text-slate-800">
          {preview.title}
        </h4>
        <p className="mt-1 line-clamp-1 text-[10px] leading-relaxed text-slate-500">
          {preview.description}
        </p>
        <p className="mt-auto line-clamp-1 pt-2 text-[10px] uppercase tracking-wider text-slate-400">
          {getPreviewHost(preview.url)}
        </p>
      </div>
    </div>
  )
}

export function SectiTimelineSection() {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [events, setEvents] = useState<TimelineEvent[]>(FALLBACK_TIMELINE_EVENTS)
  const [isLoadingNews, setIsLoadingNews] = useState(true)
  const [isLiveFeed, setIsLiveFeed] = useState(false)
  const [lastRefreshLabel, setLastRefreshLabel] = useState<string | null>(null)
  const [newsLimit, setNewsLimit] = useState(INITIAL_NEWS_LIMIT)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [hasMoreNews, setHasMoreNews] = useState(true)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    setCanScrollPrev(el.scrollLeft > 0)
    setCanScrollNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  const scrollList = useCallback((direction: "prev" | "next") => {
    const el = scrollRef.current
    if (!el) return

    const card = el.querySelector<HTMLElement>("[data-timeline-card]")
    const step = (card?.offsetWidth ?? 360) + 24
    const target = direction === "next" ? el.scrollLeft + step : el.scrollLeft - step

    el.scrollTo({ left: target, behavior: "smooth" })
  }, [])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const loadLatestNews = async () => {
      const isInitialRequest = newsLimit === INITIAL_NEWS_LIMIT

      if (isInitialRequest) {
        setIsLoadingNews(true)
      } else {
        setIsFetchingMore(true)
      }

      try {
        const response = await fetch(`/api/hub/noticias?limit=${newsLimit}&nocache=${Date.now()}`, {
          cache: "no-store",
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Falha ao atualizar noticias: status ${response.status}`)
        }

        const payload = (await response.json()) as TimelineApiResponse
        if (!isMounted) {
          return
        }

        if (Array.isArray(payload.items) && payload.items.length > 0) {
          const uniqueItems = payload.items.filter((item, index, allItems) => {
            return allItems.findIndex((candidate) => candidate.href === item.href) === index
          })

          setEvents(uniqueItems)
          setIsLiveFeed(true)
          setHasMoreNews(payload.items.length === newsLimit && newsLimit < MAX_NEWS_LIMIT)
        } else {
          setIsLiveFeed(false)
          setHasMoreNews(false)
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }

        console.warn("[SectiTimelineSection] Nao foi possivel carregar noticias ao vivo:", error)
        if (isMounted) {
          setIsLiveFeed(false)
          setHasMoreNews(newsLimit < MAX_NEWS_LIMIT)
        }
      } finally {
        if (!isMounted) {
          return
        }

        setIsLoadingNews(false)
        setIsFetchingMore(false)
        setLastRefreshLabel(
          new Intl.DateTimeFormat("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date()),
        )
      }
    }

    loadLatestNews()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [newsLimit])


  const handleLoadMore = useCallback(() => {
    if (isLoadingNews || isFetchingMore || !hasMoreNews) {
      return
    }

    setNewsLimit((currentLimit) => Math.min(MAX_NEWS_LIMIT, currentLimit + NEWS_LIMIT_STEP))
  }, [hasMoreNews, isFetchingMore, isLoadingNews])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    updateScrollButtons()
    el.addEventListener("scroll", updateScrollButtons, { passive: true })
    window.addEventListener("resize", updateScrollButtons)

    return () => {
      el.removeEventListener("scroll", updateScrollButtons)
      window.removeEventListener("resize", updateScrollButtons)
    }
  }, [updateScrollButtons])

  return (
    <section id="linha-do-tempo-secti" className="relative overflow-hidden bg-[#F4F8FC] py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#00B5AD]/10 blur-3xl" />
        <div className="absolute right-[-5rem] top-1/3 h-80 w-80 rounded-full bg-[#0077C0]/10 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 h-64 w-64 rounded-full bg-[#7AC143]/10 blur-3xl" />
      </div>

      <div className="relative z-10 px-6 pt-8 md:px-12 md:pt-12 lg:px-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700 shadow-sm">
          Linha do Tempo
        </span>
        <h2 className="mt-5 text-3xl font-black leading-[1.05] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
          Ultimos acontecimentos
          <br />
          <span className="bg-gradient-to-r from-[#0077C0] via-[#00B5AD] to-[#7AC143] bg-clip-text text-transparent">
            SECTI
          </span>
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
          Acompanhe as principais notícias e ações da Secretaria de Ciência, Tecnologia e Inovação da Bahia.
        </p>
        <p aria-live="polite" className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {isLoadingNews
            ? "Atualizando notícias do portal institucional..."
            : isFetchingMore
              ? "Buscando mais notícias da SECTI..."
              : isLiveFeed
                ? `Feed atualizado automaticamente às ${lastRefreshLabel ?? "agora"}`
                : "Modo offline: exibindo notícias salvas"}
        </p>
      </div>

      <div className="relative z-10 mt-10 px-6 md:px-12 lg:px-16">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-500">Arraste ou use as setas para navegar pelas notícias</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollList("prev")}
              disabled={!canScrollPrev}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Notícias anteriores"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollList("next")}
              disabled={!canScrollNext}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Próximas notícias"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="hide-scrollbar flex gap-6 overflow-x-auto pb-6 pr-6 scroll-smooth scroll-px-4 snap-x snap-mandatory"
          style={{
            WebkitOverflowScrolling: "touch",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {events.map((event, index) => {
            const markerColor = eventColors[index % eventColors.length]

            return (
              <div
                key={event.href}
                data-timeline-card
                className="snap-start flex-shrink-0 w-[min(100%,320px)] sm:w-[min(50%,380px)] lg:w-[min(33.333%,380px)] xl:w-[min(25%,380px)]"
              >
                <article className="relative flex min-h-[450px] max-h-[450px] flex-col overflow-hidden rounded-2xl border bg-white shadow-lg">
                    <div className="h-1.5 w-full flex-shrink-0" style={{ backgroundColor: markerColor }} />

                    <div className="flex min-h-0 flex-1 flex-col p-4 md:p-5">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white"
                          style={{ backgroundColor: markerColor }}
                        >
                          {event.date}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          {event.source}
                        </span>
                      </div>

                      <h3 className="line-clamp-2 text-base font-bold leading-snug text-slate-900 md:text-lg">
                        {event.title}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
                        {event.description}
                      </p>

                      <div className="mt-3 min-h-0 flex-1 overflow-hidden">
                        <LinkPreviewCard preview={event.preview} color={markerColor} />
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <a
                          href={event.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                          style={{ color: markerColor }}
                        >
                          Ler mais
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                          style={{ backgroundColor: `${markerColor}15`, color: markerColor }}
                        >
                          {index + 1}
                        </span>
                      </div>
                    </div>
                  </article>
                </div>
              )
            })}
          </div>
      </div>

      <div className="relative z-10 mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 bg-white/80 px-6 py-4 backdrop-blur-sm md:px-12 lg:px-16">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-slate-500 md:text-sm">
            Use as setas para navegar entre as notícias
          </p>
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingNews || isFetchingMore || !hasMoreNews}
            aria-label="Ver mais notícias da SECTI"
            className="inline-flex items-center gap-2 rounded-full border border-[#0077C0]/20 bg-[#0077C0]/5 px-3 py-1.5 text-xs font-semibold text-[#0077C0] transition-all hover:border-[#0077C0] hover:bg-[#0077C0]/10 disabled:cursor-not-allowed disabled:opacity-50 md:px-4 md:py-2"
          >
            {isFetchingMore ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Buscando...
              </>
            ) : hasMoreNews ? (
              "Ver mais notícias"
            ) : (
              "Todas carregadas"
            )}
          </button>
        </div>
        <a
          href="https://www.instagram.com/sectibahia/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:border-[#EC008C] hover:text-[#EC008C] md:px-4 md:py-2 md:text-sm"
        >
          <Instagram className="h-4 w-4" />
          @sectibahia
        </a>
      </div>
    </section>
  )
}
