"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUpRight, Instagram } from "lucide-react"

type TimelineEvent = {
  date: string
  title: string
  description: string
  href: string
  source: string
}

const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    date: "10 abr 2026",
    title: "SECTI entrega wi-fi gratuito ao Territorio da Chapada Diamantina",
    description:
      "A entrega em Seabra marcou a universalizacao do Conecta Bahia no territorio, com foco em inclusao digital e acesso a servicos publicos.",
    href: "https://www.ba.gov.br/secti/noticias/2026-04/2903/secti-entrega-wi-fi-gratuito-ao-territorio-da-chapada-diamantina",
    source: "Portal SECTI",
  },
  {
    date: "07 abr 2026",
    title: "SECTI e Sebrae entregam mapeamento do ecossistema de inovacao de Ilheus",
    description:
      "O diagnostico identifica setores estrategicos e caminhos para fortalecer governanca, talentos e novos negocios inovadores no municipio.",
    href: "https://www.ba.gov.br/secti/noticias/2026-04/2901/secti-e-sebrae-entregam-mapeamento-para-impulsionar-ecossistema-de-inovacao",
    source: "Portal SECTI",
  },
  {
    date: "07 abr 2026",
    title: "Bahia realiza 1a reuniao do Comite Intersetorial PopCiencia Jovem",
    description:
      "Instancia com participacao de governo, instituicoes cientificas e sociedade civil para consolidar a politica de popularizacao da ciencia entre juventudes.",
    href: "https://www.ba.gov.br/secti/noticias/2026-04/2900/bahia-realiza-1a-reuniao-ordinaria-do-comite-intersetorial-popciencia-jovem",
    source: "Portal SECTI",
  },
  {
    date: "06 abr 2026",
    title: "Rede Bah.IA leva letramento em IA para salas da rede publica",
    description:
      "Projeto disponibiliza material gratuito com 28 aulas e trilhas praticas para apoiar professores da educacao basica no ensino de inteligencia artificial.",
    href: "https://www.ba.gov.br/secti/noticias/2026-04/2899/rede-bahia-leva-letramento-em-inteligencia-artificial-para-salas-de-aula-da",
    source: "Portal SECTI",
  },
  {
    date: "31 mar 2026",
    title: "SECTI e CBPM inauguram hub para mineracao sustentavel",
    description:
      "O Minex Hub, primeiro do Norte e Nordeste, nasce para conectar startups, universidades e setor produtivo em desafios reais da cadeia mineral.",
    href: "https://www.ba.gov.br/secti/noticias/2026-03/2897/secti-e-cbpm-inauguram-hub-para-fortalecer-mineracao-sustentavel-na-bahia",
    source: "Portal SECTI",
  },
  {
    date: "30 mar 2026",
    title: "SECTI e Fapesb lancam rede para negocios inovadores liderados por mulheres",
    description:
      "Encontro reuniu 52 empreendedoras dos editais Inventiva e marcou o lancamento do Inventivas Hub para conexao e desenvolvimento continuo.",
    href: "https://www.ba.gov.br/secti/noticias/2026-03/2896/secti-e-fapesb-lancam-rede-para-fortalecer-negocios-inovadores-liderados-por",
    source: "Portal SECTI",
  },
]

const eventColors = ["#00B5AD", "#0077C0", "#7AC143", "#F7941D", "#EC008C", "#ED1C24"]

export function SectiTimelineSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const cardRefs = useRef<Array<HTMLElement | null>>([])
  const [progress, setProgress] = useState(0)
  const [visibleCards, setVisibleCards] = useState<number[]>([])

  const activeIndex =
    progress <= 0
      ? -1
      : Math.min(TIMELINE_EVENTS.length - 1, Math.floor(progress * TIMELINE_EVENTS.length))

  useEffect(() => {
    let rafId = 0

    const updateProgress = () => {
      const section = sectionRef.current
      if (!section) return

      const rect = section.getBoundingClientRect()
      const viewportHeight = window.innerHeight || 1
      const start = viewportHeight * 0.78
      const end = rect.height - viewportHeight * 0.22
      const rawProgress = (start - rect.top) / Math.max(end, 1)
      const nextProgress = Math.min(1, Math.max(0, rawProgress))

      setProgress((current) => {
        if (Math.abs(current - nextProgress) < 0.002) return current
        return nextProgress
      })
    }

    const onScroll = () => {
      if (rafId) return

      rafId = window.requestAnimationFrame(() => {
        updateProgress()
        rafId = 0
      })
    }

    updateProgress()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          const index = Number((entry.target as HTMLElement).dataset.index)
          if (Number.isNaN(index)) return

          setVisibleCards((current) => (current.includes(index) ? current : [...current, index]))
        })
      },
      {
        threshold: 0.25,
        rootMargin: "0px 0px -12% 0px",
      },
    )

    cardRefs.current.forEach((node) => {
      if (node) observer.observe(node)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="linha-do-tempo-secti"
      className="relative overflow-hidden bg-gradient-to-b from-[#F4F8FC] via-white to-[#F9FBF6] py-28 md:py-32"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#00B5AD]/10 blur-3xl" />
        <div className="absolute right-[-5rem] top-1/3 h-80 w-80 rounded-full bg-[#0077C0]/10 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 h-64 w-64 rounded-full bg-[#7AC143]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[1250px] px-6 md:px-12 lg:px-16">
        <div className="mb-14 md:mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700 shadow-sm">
            Linha do Tempo
          </span>
          <h2 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-slate-900 md:text-6xl">
            Ultimos acontecimentos
            <br />
            <span className="bg-gradient-to-r from-[#0077C0] via-[#00B5AD] to-[#7AC143] bg-clip-text text-transparent">
              mais importantes da SECTI
            </span>
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-600 md:text-lg">
            Secao com atualizacao recente baseada no portal oficial e com acompanhamento complementar no Instagram da SECTI.
          </p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[110px_minmax(0,1fr)] lg:gap-12">
          <div className="relative hidden lg:block">
            <div className="sticky top-28">
              <div className="mx-auto h-[620px] w-[6px] overflow-hidden rounded-full bg-slate-200/80">
                <div
                  className="w-full rounded-full bg-gradient-to-b from-[#00B5AD] via-[#0077C0] to-[#7AC143] transition-[height] duration-300 ease-out"
                  style={{ height: `${Math.max(progress * 100, 2)}%` }}
                />
              </div>
              <p className="mt-4 text-center text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                {Math.round(progress * 100)}% percorrido
              </p>
            </div>
          </div>

          <div className="relative space-y-6 md:space-y-8">
            <div className="absolute left-[11px] top-2 h-[calc(100%-0.5rem)] w-[2px] bg-slate-200 lg:hidden" />

            {TIMELINE_EVENTS.map((event, index) => {
              const isVisible = visibleCards.includes(index)
              const isActive = index <= activeIndex
              const markerColor = eventColors[index % eventColors.length]

              return (
                <article
                  key={event.title}
                  data-index={index}
                  ref={(node) => {
                    cardRefs.current[index] = node
                  }}
                  className={`relative overflow-hidden rounded-3xl border bg-white/90 p-6 pl-10 shadow-sm backdrop-blur transition-all duration-700 md:p-8 md:pl-12 lg:pl-8 ${
                    isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-30"
                  } ${isActive ? "border-slate-900/25 shadow-xl" : "border-slate-200/80"}`}
                  style={{ transitionDelay: `${Math.min(index * 70, 280)}ms` }}
                >
                  <div
                    className="absolute left-[5px] top-10 h-3.5 w-3.5 rounded-full border-[3px] border-white shadow-md transition-transform duration-500 lg:left-[-27px]"
                    style={{
                      backgroundColor: markerColor,
                      transform: isActive ? "scale(1.3)" : "scale(1)",
                    }}
                  />

                  <div
                    className="absolute inset-y-0 left-0 w-1.5 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(180deg, ${markerColor} 0%, transparent 100%)`,
                      opacity: isActive ? 1 : 0.45,
                    }}
                  />

                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                      {event.date}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {event.source}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold leading-tight text-slate-900">{event.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-slate-600">{event.description}</p>

                  <a
                    href={event.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0077C0] transition-colors hover:text-[#00B5AD]"
                  >
                    Ler noticia completa
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </article>
              )
            })}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-sm md:flex-row md:items-center md:justify-between md:p-6">
          <p className="text-sm leading-relaxed text-slate-600">
            Fontes monitoradas: portal oficial da SECTI e Instagram institucional para acompanhar atualizacoes.
          </p>
          <a
            href="https://www.instagram.com/sectibahia/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-[#EC008C] hover:text-[#EC008C]"
          >
            <Instagram className="h-4 w-4" />
            @sectibahia
          </a>
        </div>
      </div>
    </section>
  )
}