"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

type Props = {
  active: boolean
}

export function PerfOverlay({ active }: Props) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (active) {
      const t = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(t)
    }
    setVisible(false)
  }, [active])

  if (!mounted || !active) return null

  // Apenas um dim sutil sobre o conteudo da pagina
  // O chatbot (z-50) fica por cima, sem bloqueio visual agressivo
  return createPortal(
    <div
      className={`fixed inset-0 z-[48] bg-gradient-to-b from-black/60 via-black/50 to-black/60 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden
    />,
    document.body
  )
}
