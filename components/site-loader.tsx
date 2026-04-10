"use client"

import { useEffect, useRef, useState } from "react"

const MIN_VISIBLE_MS = 1200

export function SiteLoader() {
  const [isVisible, setIsVisible] = useState(true)
  const [showWordmark, setShowWordmark] = useState(false)
  const startTimeRef = useRef(0)

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setShowWordmark(true)
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [])

  useEffect(() => {
    startTimeRef.current = performance.now()

    let timeoutId: number | null = null

    const hideLoader = () => {
      const elapsed = performance.now() - startTimeRef.current
      const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed)

      timeoutId = window.setTimeout(() => {
        setIsVisible(false)
      }, remaining)
    }

    if (document.readyState === "complete") {
      hideLoader()
    } else {
      window.addEventListener("load", hideLoader, { once: true })
    }

    return () => {
      window.removeEventListener("load", hideLoader)
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [])

  if (!isVisible) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Carregando portal SECTI"
      className="fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#11416c_0%,_#05223f_45%,_#020e1f_100%)]"
    >
      <div className="site-loader-wordmark" aria-hidden="true">
        {showWordmark ? (
          <>
            <span>SECTI</span>
            <span>SECTI</span>
          </>
        ) : null}
      </div>
      <span className="sr-only">Carregando...</span>
    </div>
  )
}
