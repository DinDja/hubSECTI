"use client"

import Image from "next/image"
import { ArrowUpRight, ArrowUp, Mail, Phone, MapPin } from "lucide-react"
import { AnimatedLogo } from "./animated-logo"
import govbaLogo from "@/app/assets/images/MARCA GOVBA 0126 - DO LADO DA GENTE__H.png"

const colors = {
  green: "#7AC143",
  cyan: "#00B5AD",
  orange: "#F7941D",
  blue: "#0077C0",
  red: "#ED1C24",
  yellow: "#FDB913",
  magenta: "#EC008C",
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  const links = [
    {
      title: "Sistemas",
      items: [
        { label: "Gestão de Projetos", href: "https://secti.netlify.app" },
        { label: "Gestão de Contratos", href: "https://secti-contratos.netlify.app/" },
        { label: "Painel Conecta Bahia", href: "https://conectabahia.netlify.app/" },
        { label: "Observatório de CT&I", href: "https://simcc.uesc.br/observatorio" },
        { label: "Mapeamento EPT", href: "https://mapfilterdemo.netlify.app/" },
        { label: "Leitura Integral de Projetos", href: "https://projetosclubes.netlify.app/" },
        { label: "SECTISPEAK", href: "https://cloudspeak.netlify.app/" },
        { label: "Painel SECTI Territórios", href: "https://secti-territorios.netlify.app/" },
      ],
    },
    {
      title: "Institucional",
      items: [
        { label: "Portal SECTI", href: "https://www.secti.ba.gov.br" },
        { label: "Governo da Bahia", href: "https://www.ba.gov.br" },
        { label: "Transparencia", href: "https://www.transparencia.ba.gov.br" },
        { label: "Ouvidoria", href: "https://www.ouvidoria.ba.gov.br" },
      ],
    },
  ]

  return (
    <footer className="relative overflow-hidden bg-background">
      {/* Decorative shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg 
          className="absolute -top-20 -right-20 w-80 h-80 opacity-[0.03]" 
          viewBox="0 0 200 200"
        >
          <polygon 
            points="100,10 190,60 190,140 100,190 10,140 10,60" 
            fill={colors.cyan}
          />
        </svg>
        <svg 
          className="absolute -bottom-10 -left-10 w-60 h-60 opacity-[0.03]" 
          viewBox="0 0 200 200"
        >
          <circle cx="100" cy="100" r="90" fill={colors.magenta} />
        </svg>
      </div>

      {/* Gradient top border */}
      <div 
        className="h-1"
        style={{
          background: `linear-gradient(90deg, ${colors.green}, ${colors.cyan}, ${colors.blue}, ${colors.magenta}, ${colors.orange}, ${colors.red}, ${colors.yellow})`,
        }}
      />

      {/* Main footer */}
      <div className="relative px-6 md:px-10 lg:px-16 py-16 md:py-20 max-w-[1600px] mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-6 mb-8">
              <div className="h-12 w-auto">
                <Image
                  src={govbaLogo}
                  alt="Governo do Estado da Bahia"
                  width={180}
                  height={48}
                  className="h-auto w-auto object-contain"
                />
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed max-w-md mb-8">
              Secretaria de Ciencia, Tecnologia e Inovacao do Estado da Bahia. 
              Promovendo o desenvolvimento atraves da inovacao e da transformacao digital.
            </p>
          </div>

          {/* Links */}
          {links.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-6 font-semibold">
                {section.title}
              </h4>
              <ul className="space-y-4">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors"
                    >
                      {item.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-8 border-t border-border">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              {currentYear} Governo do Estado da Bahia. Todos os direitos reservados.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Politica de Privacidade
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Termos de Uso
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Acessibilidade
            </a>
          </div>
        </div>
      </div>

      {/* Large BAHIA text watermark */}
      <div className="relative h-24 md:h-32 overflow-hidden">
        <div 
          className="absolute inset-0 flex items-center justify-center select-none" 
          style={{
            fontSize: "clamp(6rem, 20vw, 14rem)",
            fontWeight: 900,
            letterSpacing: "-0.05em",
            background: `linear-gradient(90deg, ${colors.green}08, ${colors.cyan}08, ${colors.blue}08, ${colors.magenta}08, ${colors.orange}08, ${colors.red}08, ${colors.yellow}08)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          BAHIA
        </div>
      </div>
    </footer>
  )
}
