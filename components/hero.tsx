"use client"

import { useEffect, useState, useRef } from "react"
import { ArrowDown, ExternalLink } from "lucide-react"

export function Hero() {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollY, setScrollY] = useState(0)
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
        
        {/* Geometric accents */}
        <svg 
          className="absolute top-32 right-[10%] w-64 h-64 opacity-[0.07]"
          viewBox="0 0 200 200"
          style={{ transform: `translateY(${parallaxOffset * 0.5}px)` }}
        >
          <circle cx="100" cy="100" r="80" fill="none" stroke="#0066B3" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="#00BFB3" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="40" fill="none" stroke="#8CC63F" strokeWidth="0.5" />
        </svg>

        <svg 
          className="absolute bottom-40 left-[5%] w-48 h-48 opacity-[0.07]"
          viewBox="0 0 200 200"
          style={{ transform: `translateY(${-parallaxOffset * 0.3}px)` }}
        >
          <rect x="40" y="40" width="120" height="120" fill="none" stroke="#F7941D" strokeWidth="0.5" />
          <rect x="60" y="60" width="80" height="80" fill="none" stroke="#EC008C" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="w-full max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left column - Text */}
            <div>
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
                Acesso centralizado aos portais, paineis e ferramentas de gestao da 
                <span className="font-semibold text-gray-900"> Secretaria de Ciencia, Tecnologia e Inovacao</span>.
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

            {/* Right column - Stats/Visual */}
            <div 
              className={`relative transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
            >
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "6+", label: "Sistemas Ativos", color: "#0066B3", delay: 0 },
                  { value: "24/7", label: "Disponibilidade", color: "#8CC63F", delay: 200 },
                ].map((stat, i) => (
                  <div 
                    key={i}
                    className="group relative bg-white p-8 border border-gray-100 hover:border-gray-200 transition-all duration-500 hover:shadow-xl"
                    style={{ transitionDelay: `${stat.delay}ms` }}
                  >
                    {/* Color accent */}
                    <div 
                      className="absolute top-0 left-0 w-1 h-full transition-all duration-300 group-hover:w-2"
                      style={{ backgroundColor: stat.color }}
                    />
                    
                    <div 
                      className="text-4xl md:text-5xl font-bold mb-2 transition-colors duration-300"
                      style={{ color: stat.color }}
                    >
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Decorative corner element */}
           
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
