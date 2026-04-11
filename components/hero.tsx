"use client"

import { useEffect, useState, useRef } from "react"
import { ArrowDown, ExternalLink } from "lucide-react"

interface TimelineEvent {
  date: string
  title: string
  description: string
  href: string
  source: string
}

const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    date: "10 abr 2026",
    title: "Wi-Fi gratuito na Chapada Diamantina",
    description:
      "Universalização do Conecta Bahia no território, com foco em inclusão digital.",
    href: "https://www.ba.gov.br/secti/noticias/2026-04/2903/secti-entrega-wi-fi-gratuito-ao-territorio-da-chapada-diamantina",
    source: "Portal SECTI",
  },
  {
    date: "07 abr 2026",
    title: "Mapeamento do ecossistema de Ilhéus",
    description:
      "Diagnóstico para fortalecer governança, talentos e novos negócios inovadores.",
    href: "https://www.ba.gov.br/secti/noticias/2026-04/2901/secti-e-sebrae-entregam-mapeamento-para-impulsionar-ecossistema-de-inovacao",
    source: "Portal SECTI",
  },
  {
    date: "07 abr 2026",
    title: "Comitê PopCiência Jovem",
    description:
      "Política de popularização da ciência entre juventudes.",
    href: "https://www.ba.gov.br/secti/noticias/2026-04/2900/bahia-realiza-1a-reuniao-ordinaria-do-comite-intersetorial-popciencia-jovem",
    source: "Portal SECTI",
  },
  {
    date: "06 abr 2026",
    title: "Rede Bah.IA de letramento em IA",
    description:
      "Material gratuito com 28 aulas para professores da educação básica.",
    href: "https://www.ba.gov.br/secti/noticias/2026-04/2899/rede-bahia-leva-letramento-em-inteligencia-artificial-para-salas-de-aula-da",
    source: "Portal SECTI",
  },
  {
    date: "31 mar 2026",
    title: "Minex Hub - mineração sustentável",
    description:
      "Primeiro hub do Norte e Nordeste para conectar startups e universidades.",
    href: "https://www.ba.gov.br/secti/noticias/2026-03/2897/secti-e-cbpm-inauguram-hub-para-fortalecer-mineracao-sustentavel-na-bahia",
    source: "Portal SECTI",
  },
  {
    date: "30 mar 2026",
    title: "Inventivas Hub - empreendedoras",
    description:
      "Rede para negócios inovadores liderados por mulheres.",
    href: "https://www.ba.gov.br/secti/noticias/2026-03/2896/secti-e-fapesb-lancam-rede-para-fortalecer-negocios-inovadores-liderados-por",
    source: "Portal SECTI",
  },
]

const FRUIT_COLORS = [
  "#8CC63F", // Verde
  "#00BFB3", // Teal
  "#EC008C", // Rosa
  "#F7941D", // Laranja
  "#0066B3", // Azul
  "#FFC20E", // Amarelo
]

// Posições dos frutos na SVG da árvore
const FRUIT_POSITIONS = [
  { x: 138, y: 78 },   // Fruto 1 - Verde superior esquerdo
  { x: 346, y: 78 },   // Fruto 2 - Teal superior direito
  { x: 104, y: 214 },  // Fruto 3 - Rosa meio esquerdo
  { x: 332, y: 220 },  // Fruto 4 - Laranja meio direito
  { x: 200, y: 306 },  // Fruto 5 - Azul centro
  { x: 390, y: 286 },  // Fruto 6 - Amarelo direita
]

function TechTree({ events, hoveredFruit, setHoveredFruit }: { 
  events: TimelineEvent[]
  hoveredFruit: number | null
  setHoveredFruit: (index: number | null) => void 
}) {
  const [tooltipCoords, setTooltipCoords] = useState<{ x: number; y: number } | null>(null)
  const treeRef = useRef<HTMLDivElement>(null)

  const handleFruitHover = (index: number) => {
    setHoveredFruit(index)
  }

  const handleFruitMove = (event: React.MouseEvent<SVGGElement>, index: number) => {
    handleFruitHover(index)
    const rect = treeRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltipCoords({
      x: event.clientX - rect.left + 12,
      y: event.clientY - rect.top + 12,
    })
  }

  const handleFruitLeave = () => {
    setHoveredFruit(null)
    setTooltipCoords(null)
  }

  return (
    <div ref={treeRef} className="relative flex h-full w-full items-center justify-center lg:justify-end overflow-visible">
      <svg
        viewBox="0 0 494 522"
        className="h-full w-auto max-w-full"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Arvore de inovacao com frutos interativos"
        style={{
          filter: "drop-shadow(0 25px 50px rgba(0, 102, 179, 0.15))",
        }}
      >
        <image
          href="/tree.svg"
          x="0"
          y="0"
          width="494"
          height="522"
          preserveAspectRatio="xMidYMid meet"
          style={{ pointerEvents: "none" }}
        />

        {events.map((event, i) => {
          const pos = FRUIT_POSITIONS[i]
          const isHovered = hoveredFruit === i
          const color = FRUIT_COLORS[i]

          return (
            <g
              key={i}
              onMouseEnter={() => handleFruitHover(i)}
              onMouseLeave={handleFruitLeave}
              onMouseMove={(event) => handleFruitMove(event, i)}
              onClick={() => window.open(event.href, "_blank")}
              style={{ pointerEvents: "auto", cursor: "pointer" }}
            >
              {/* Glow ao fazer hover */}
              {isHovered && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="28"
                  fill={color}
                  opacity="0.2"
                  className="animate-pulse"
                  style={{ animationDuration: "1.5s" }}
                />
              )}

              {/* Fruto principal */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isHovered ? 20 : 16}
                fill={color}
                className="transition-all duration-300"
                style={{
                  filter: isHovered
                    ? `drop-shadow(0 0 12px ${color})`
                    : `drop-shadow(0 0 4px rgba(0, 0, 0, 0.2))`,
                }}
              />

              {/* Brilho no fruto */}
              <circle
                cx={pos.x - 5}
                cy={pos.y - 5}
                r="4"
                fill="white"
                opacity={isHovered ? 0.8 : 0.4}
                className="transition-all duration-300"
              />
            </g>
          )
        })}
      </svg>

      {hoveredFruit !== null && tooltipCoords && (
        <div
          className="pointer-events-none absolute z-50 max-w-xs rounded-3xl border border-gray-200 bg-white p-3 shadow-2xl"
          style={{
            left: tooltipCoords.x,
            top: tooltipCoords.y,
            transform: "translate(10px, 10px)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: FRUIT_COLORS[hoveredFruit] }}
            />
            <span className="text-[11px] uppercase tracking-[0.16em] text-gray-400">
              {events[hoveredFruit].date}
            </span>
          </div>
          <div className="text-sm font-semibold text-gray-900 mb-1">
            {events[hoveredFruit].title}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            {events[hoveredFruit].description}
          </p>
        </div>
      )}
    </div>
  )
}

function FruitTooltip({ event, color, index }: { event: TimelineEvent; color: string; index: number }) {
  return (
    <a
      href={event.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block p-4 bg-white border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg"
    >
      <div 
        className="absolute top-0 left-0 w-1 h-full transition-all duration-300 group-hover:w-2"
        style={{ backgroundColor: color }}
      />
      <div className="pl-3">
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs text-gray-400 font-medium">{event.date}</span>
        </div>
        <h4 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-[#0066B3] transition-colors">
          {event.title}
        </h4>
        <p className="text-xs text-gray-500 leading-relaxed">
          {event.description}
        </p>
      </div>
    </a>
  )
}



export function Hero() {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [hoveredFruit, setHoveredFruit] = useState<number | null>(null)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsVisible(true)
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const parallaxOffset = scrollY * 0.3

  const carouselItems = [
    "Gestão de Projetos",
    "Gestão de Contratos",
    "Painel Conecta Bahia",
    "Observatório de CT&I",
    "Mapeamento EPT",
    "Leitura Integral de Projetos",
    "SECTISPEAK",
    "Painel SECTI Territórios",
  ]

  return (
    <section 
      ref={heroRef}
      className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-[#FAFAFA]"
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-[#FAFAFA] pointer-events-none" />
      
      {/* Elegant color bar at top */}
      <div className="relative z-20 flex h-1">
        <div className="flex-1 bg-[#8CC63F]" />
        <div className="flex-1 bg-[#00BFB3]" />
        <div className="flex-1 bg-[#EC008C]" />
        <div className="flex-1 bg-[#F7941D]" />
        <div className="flex-1 bg-[#0066B3]" />
        <div className="flex-1 bg-[#ED1C24]" />
        <div className="flex-1 bg-[#FFC20E]" />
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large typography background */}
        <div 
          className="absolute -right-0 top-1/2 -translate-y-1/2 text-[20vw] font-black text-gray-100/50 leading-none tracking-tighter select-none"
          style={{ transform: `translateY(calc(-50% + ${parallaxOffset}px))` }}
        >
          SECTI
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="w-full max-w-[1680px] mx-auto px-6 md:px-12 lg:px-20 ">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]  items-center">
            {/* Left column - Text */}
            <div className="min-w-0 lg:self-center">
              {/* Eyebrow */}
              <div 
                className={`flex items-center gap-3 mb-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              >
                <div className="flex gap-0.5">
                  {["#8CC63F", "#00BFB3", "#EC008C", "#F7941D", "#0066B3"].map((color, i) => (
                    <div 
                      key={i}
                      className="w-3 h-3 transition-transform duration-300 hover:scale-110"
                      style={{ 
                        backgroundColor: color,
                        transitionDelay: `${i * 50}ms`
                      }}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">
                  Governo do Estado da Bahia
                </span>
              </div>

              {/* Main heading */}
              <h1 
                className={`mb-8 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              >
                <span className="block text-[clamp(2.5rem,5vw,4.5rem)] font-bold text-gray-900 leading-[1.05] tracking-tight">
                  Hub de Sistemas
                </span>
                <span className="block text-[clamp(2.5rem,5vw,4.5rem)] font-bold leading-[1.05] tracking-tight mt-2">
                  <span className="bg-gradient-to-r from-[#0066B3] via-[#00BFB3] to-[#8CC63F] bg-clip-text text-transparent">
                    Integrados
                  </span>
                </span>
              </h1>

              {/* Description */}
              <p 
                className={`text-lg md:text-xl text-gray-600 max-w-lg leading-relaxed mb-10 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              >
                Acesso centralizado aos portais, painéis e ferramentas de gestão da 
                <span className="font-semibold text-gray-900"> Secretaria de Ciência, Tecnologia e Inovação</span>.
              </p>

              {/* CTAs */}
              <div 
                className={`flex flex-wrap gap-4 transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              >
                <a 
                  href="#sistemas"
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white font-medium overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-gray-900/20"
                >
                  <span className="relative z-10">Acessar Sistemas</span>
                  <ArrowDown className="relative z-10 w-4 h-4 transition-transform group-hover:translate-y-1" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0066B3] to-[#00BFB3] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </a>
                <a 
                  href="https://www.secti.ba.gov.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 px-8 py-4 text-gray-700 font-medium border border-gray-200 hover:border-gray-900 transition-all duration-300"
                >
                  <span>Portal SECTI</span>
                  <ExternalLink className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>

            {/* Right column - Tech Tree */}
            <div 
              className={`relative min-w-0 flex justify-center lg:justify-end lg:self-center transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
            >
              <div className="relative">
                {/* Tree visualization */}
                <div className="relative h-[660px] md:h-[780px] lg:h-[880px] xl:h-[960px] w-full max-w-[860px] overflow-visible">
                  <TechTree 
                    events={TIMELINE_EVENTS} 
                    hoveredFruit={hoveredFruit}
                    setHoveredFruit={setHoveredFruit}
                  />

                  {/* Legend */}
                  <div className={`absolute bottom-24 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs text-gray-400 shadow-lg transition-all duration-500 backdrop-blur-sm ${
                    hoveredFruit === null ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#0066B3] animate-pulse" />
                      Passe o mouse nos frutos para ver as entregas
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="relative z-10 border-t border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="flex items-center justify-between py-6">
            <div className="relative overflow-hidden w-full">
              <div className="flex gap-8 min-w-full animate-marquee">
                {[...carouselItems, ...carouselItems].map((item, i) => (
                  <span 
                    key={i}
                    className="flex-none text-sm text-gray-400 font-medium whitespace-nowrap hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <a 
              href="#sistemas"
              className="hidden md:flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors ms-4"
            >
              <span>Role para explorar</span>
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </a>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .animate-marquee {
          animation: marquee 24s linear infinite;
        }
      `}</style>
    </section>
  )
}
