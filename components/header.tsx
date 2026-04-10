"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Menu, X } from "lucide-react"
import govbaLogo from "@/app/assets/images/MARCA GOVBA 0126 - DO LADO DA GENTE__H.png"

const colors = ["#7AC143", "#00B5AD", "#F7941D", "#0077C0", "#ED1C24", "#EC008C", "#FDB913"]

function AnimatedLogo() {
  const letters = "BAHIA".split("")
  
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <div className="relative flex items-center">
        {/* Animated bars */}
        <div className="flex gap-[2px] mr-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-1 rounded-full transition-all duration-300"
              style={{
                backgroundColor: colors[i],
                height: `${12 + i * 4}px`,
                animation: `pulse-bar 1.5s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
        
        <span className="text-xl font-black tracking-tight">SECTI</span>
        <span className="text-xl font-light text-muted-foreground">/</span>
        <span className="relative overflow-hidden">
          <span className="text-xl font-medium bg-gradient-to-r from-[#0077C0] to-[#00B5AD] bg-clip-text text-transparent">
            hub
          </span>
        </span>
      </div>
    </Link>
  )
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState("")

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
      
      // Detect active section
      const sections = ["sistemas", "sobre"]
      for (const section of sections) {
        const el = document.getElementById(section)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section)
            break
          }
        }
      }
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { href: "#sistemas", label: "Sistemas", color: "#0077C0" },
    { href: "#sobre", label: "Sobre", color: "#7AC143" },
  ]

  return (
    <>
      <style jsx global>{`
        @keyframes pulse-bar {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.3); }
        }
      `}</style>
      
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-border/50" 
            : "bg-transparent"
        }`}
      >
        {/* Color bar on top */}
        <div className="h-1 w-full flex">
          {colors.map((color, i) => (
            <div 
              key={i} 
              className="flex-1 transition-all duration-300"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <nav className="flex items-center justify-between px-6 py-4 md:px-12 lg:px-20 max-w-[1800px] mx-auto">
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <Image
                src={govbaLogo}
                alt="Governo do Estado da Bahia"
                width={160}
                height={42}
                className="object-contain"
              />
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-5 py-2.5 text-sm font-medium transition-all duration-300 rounded-full group ${
                  activeSection === item.href.slice(1)
                    ? "text-white"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                {/* Active background */}
                <span
                  className={`absolute inset-0 rounded-full transition-all duration-300 ${
                    activeSection === item.href.slice(1) ? "opacity-100 scale-100" : "opacity-0 scale-95"
                  }`}
                  style={{ backgroundColor: item.color }}
                />
                
                {/* Hover background */}
                <span
                  className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                  style={{ backgroundColor: item.color }}
                />
                
                <span className="relative z-10">{item.label}</span>
              </Link>
            ))}
            
            <div className="w-px h-6 bg-border mx-2" />
            
            <Link
              href="https://www.secti.ba.gov.br"
              target="_blank"
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full border-2 border-foreground/10 hover:border-[#ED1C24] hover:text-[#ED1C24] transition-all duration-300 group"
            >
              <span>Portal Oficial</span>
              <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-xl border border-border hover:bg-muted transition-colors"
            aria-label="Menu"
          >
            <div className="relative w-5 h-5">
              <span 
                className={`absolute left-0 w-5 h-0.5 bg-foreground transition-all duration-300 ${
                  isMenuOpen ? "top-[9px] rotate-45" : "top-1"
                }`} 
              />
              <span 
                className={`absolute left-0 top-[9px] w-5 h-0.5 bg-foreground transition-all duration-300 ${
                  isMenuOpen ? "opacity-0 scale-0" : "opacity-100 scale-100"
                }`} 
              />
              <span 
                className={`absolute left-0 w-5 h-0.5 bg-foreground transition-all duration-300 ${
                  isMenuOpen ? "top-[9px] -rotate-45" : "top-[17px]"
                }`} 
              />
            </div>
          </button>
        </nav>

        {/* Mobile menu */}
        <div 
          className={`md:hidden absolute top-full left-0 right-0 bg-white border-b border-border overflow-hidden transition-all duration-500 ${
            isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-6 py-6 flex flex-col gap-2">
            {navItems.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-muted transition-colors group"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div 
                  className="w-3 h-3 rounded-full transition-transform duration-300 group-hover:scale-125"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-lg font-medium">{item.label}</span>
              </Link>
            ))}
            
            <div className="h-px bg-border my-2" />
            
            <Link
              href="https://www.secti.ba.gov.br"
              target="_blank"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-foreground text-background"
            >
              <span className="font-medium">Portal Oficial</span>
              <ArrowUpRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>
    </>
  )
}
