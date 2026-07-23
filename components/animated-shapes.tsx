"use client"

import { useEffect, useState } from "react"

export function AnimatedShapes() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Formas geometricas flutuantes */}
      <svg
        className="absolute top-20 left-[10%] w-24 h-24 animate-float"
        viewBox="0 0 100 100"
        style={{ animationDelay: "0s" }}
      >
        <polygon
          points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
          fill="none"
          stroke="#7AC143"
          strokeWidth="2"
          className="opacity-40"
        />
      </svg>

      <svg
        className="absolute top-40 right-[15%] w-32 h-32 animate-float-reverse"
        viewBox="0 0 100 100"
        style={{ animationDelay: "1s" }}
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#00B5AD"
          strokeWidth="2"
          className="opacity-30"
          strokeDasharray="10 5"
        />
      </svg>

      <svg
        className="absolute top-[60%] left-[5%] w-20 h-20 animate-spin-slow"
        viewBox="0 0 100 100"
      >
        <rect
          x="20"
          y="20"
          width="60"
          height="60"
          fill="none"
          stroke="#F7941D"
          strokeWidth="2"
          className="opacity-30"
          transform="rotate(45 50 50)"
        />
      </svg>

      <svg
        className="absolute top-[30%] right-[8%] w-16 h-16 animate-bounce-subtle"
        viewBox="0 0 100 100"
        style={{ animationDelay: "0.5s" }}
      >
        <polygon
          points="50,10 90,90 10,90"
          fill="none"
          stroke="#EC008C"
          strokeWidth="2"
          className="opacity-40"
        />
      </svg>

      <svg
        className="absolute bottom-[20%] right-[20%] w-28 h-28 animate-float"
        viewBox="0 0 100 100"
        style={{ animationDelay: "2s" }}
      >
        <path
          d="M50 10 L90 50 L50 90 L10 50 Z"
          fill="none"
          stroke="#0077C0"
          strokeWidth="2"
          className="opacity-30"
        />
      </svg>

      <svg
        className="absolute bottom-[30%] left-[15%] w-20 h-20 animate-pulse-scale"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="8"
          fill="#ED1C24"
          className="opacity-50"
        />
        <circle
          cx="50"
          cy="50"
          r="25"
          fill="none"
          stroke="#ED1C24"
          strokeWidth="1"
          className="opacity-30"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#ED1C24"
          strokeWidth="1"
          className="opacity-20"
        />
      </svg>

      {/* Blob animado */}
      <div
        className="absolute top-[15%] right-[25%] w-64 h-64 animate-morph opacity-10"
        style={{
          background: "linear-gradient(135deg, #7AC143, #00B5AD, #0077C0)",
        }}
      />

      {/* Linhas conectoras animadas */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.1 }}
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7AC143" />
            <stop offset="50%" stopColor="#00B5AD" />
            <stop offset="100%" stopColor="#0077C0" />
          </linearGradient>
        </defs>
        <path
          d="M0,400 Q400,300 800,400 T1600,400"
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="1"
          className="opacity-50"
        />
        <path
          d="M0,600 Q400,500 800,600 T1600,600"
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="1"
          className="opacity-30"
        />
      </svg>

      {/* Particulas de cor */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-float"
          style={{
            width: `${8 + i * 4}px`,
            height: `${8 + i * 4}px`,
            left: `${10 + i * 12}%`,
            top: `${20 + (i % 3) * 25}%`,
            backgroundColor: [
              "#7AC143",
              "#00B5AD",
              "#F7941D",
              "#0077C0",
              "#ED1C24",
              "#FDB913",
              "#EC008C",
              "#7AC143",
            ][i],
            opacity: 0.15 + i * 0.03,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${5 + i}s`,
          }}
        />
      ))}
    </div>
  )
}
