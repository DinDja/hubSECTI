"use client"

import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 100)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (!isVisible) return null

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Voltar ao topo"
      className="cursor-pointer fixed bottom-6 right-6 z-50 inline-flex items-center justify-center rounded-full bg-foreground text-background p-4 shadow-2xl shadow-black/20 transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  )
}
