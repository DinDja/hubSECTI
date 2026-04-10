"use client"

import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

interface CreativeProgressBarProps {
  progress: number
  activeIndex: number
  totalCards: number
  className?: string
}

export function CreativeProgressBar({
  progress,
  activeIndex,
  totalCards,
  className,
}: CreativeProgressBarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.max(1, Math.floor(rect.width * dpr))
    canvas.height = Math.max(1, Math.floor(rect.height * dpr))
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const width = rect.width
    const height = rect.height

    ctx.clearRect(0, 0, width, height)

    const progressWidth = width * progress
    const particleCount = Math.floor(progress * 20) + 3

    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * progressWidth
      const y = height / 2 + (Math.random() - 0.5) * 14
      const radius = Math.random() * 2 + 0.5
      const opacity = Math.random() * 0.6 + 0.2

      const t = width === 0 ? 0 : x / width
      const r = Math.round(0 + t * 122)
      const g = Math.round(181 - t * 8)
      const b = Math.round(173 - t * 106)

      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`
      ctx.fill()
    }

    if (progress > 0.01) {
      const edgeX = progressWidth
      const edgeY = height / 2
      const gradient = ctx.createRadialGradient(edgeX, edgeY, 0, edgeX, edgeY, 12)

      gradient.addColorStop(0, "rgba(0, 181, 173, 0.5)")
      gradient.addColorStop(1, "rgba(0, 181, 173, 0)")

      ctx.beginPath()
      ctx.arc(edgeX, edgeY, 12, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()
    }
  }, [progress, activeIndex, totalCards])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || typeof ResizeObserver === "undefined") return

    const observer = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
    })

    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  const dots = Array.from({ length: totalCards }, (_, i) => i)

  return (
    <div className={cn("relative w-full max-w-3xl", className)}>
      <div className="mb-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-8 w-8 items-center justify-center">
            <span
              className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#00B5AD]"
              style={{ animationDuration: "3s" }}
            />
            <span className="text-sm font-bold text-slate-700">
              {totalCards > 0 ? activeIndex + 1 : 0}
            </span>
          </span>
          <span className="text-sm font-medium text-slate-500">de {totalCards}</span>
        </div>
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00B5AD]">
          {Math.round(progress * 100)}%
        </span>
      </div>

      <div className="relative">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="relative h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              background:
                "linear-gradient(90deg, #00B5AD 0%, #0077C0 50%, #7AC143 100%)",
            }}
          >
            <div
              className="absolute inset-0 rounded-full opacity-80"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 2s linear infinite",
              }}
            />
          </div>
        </div>

        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ top: "-8px", height: "calc(100% + 16px)" }}
        />

        {totalCards > 1 && (
          <div className="pointer-events-none absolute inset-0 flex items-center">
            {dots.map((i) => {
              const position = (i / (totalCards - 1)) * 100
              const isCompleted = i < activeIndex
              const isActive = i === activeIndex

              return (
                <div
                  key={i}
                  className="absolute flex items-center justify-center"
                  style={{
                    left: `${position}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  {isActive && (
                    <span
                      className="absolute h-5 w-5 animate-ping rounded-full bg-[#00B5AD]/30"
                      style={{ animationDuration: "2s" }}
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 h-3 w-3 rounded-full border-2 transition-all duration-500",
                      isCompleted
                        ? "scale-100 border-[#7AC143] bg-[#7AC143]"
                        : isActive
                          ? "scale-125 border-[#00B5AD] bg-[#00B5AD] shadow-[0_0_8px_rgba(0,181,173,0.5)]"
                          : "scale-90 border-slate-300 bg-white"
                    )}
                  >
                    {isCompleted && (
                      <svg
                        className="absolute inset-0 m-auto h-2 w-2 text-white"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2.5 6L5 8.5L9.5 3.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-1">
        {dots.map((i) => {
          const isCompleted = i < activeIndex
          const isActive = i === activeIndex

          return (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-500",
                isCompleted
                  ? "bg-[#7AC143]/40"
                  : isActive
                    ? "bg-[#00B5AD]/60"
                    : "bg-slate-200"
              )}
            />
          )
        })}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  )
}
