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

  // Trava scroll do body quando ativo
  useEffect(() => {
    if (active) {
      const prev = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => { document.body.style.overflow = prev }
    }
  }, [active])

  if (!mounted || !active) return null

  // z-[55] cobre header (z-50) mas chatbot fica em z-[60]
  return createPortal(
    <div
      className={`fixed inset-0 z-[55] bg-gradient-to-b from-black/60 via-black/50 to-black/60 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden
    />,
    document.body
  )
}
