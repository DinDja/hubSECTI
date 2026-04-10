"use client"

import { useEffect, useState } from "react"

export function AnimatedLogo({ className = "" }: { className?: string }) {
  const [isHovered, setIsHovered] = useState(false)
  
  const colors = {
    green: "#7AC143",
    cyan: "#00B5AD",
    orange: "#F7941D",
    blue: "#0077C0",
    red: "#ED1C24",
    yellow: "#FDB913",
    magenta: "#EC008C",
  }

  return (
    <div 
      className={`relative cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        viewBox="0 0 200 60"
        className="h-10 md:h-12"
        style={{ overflow: "visible" }}
      >
        {/* S */}
        <g className="transition-transform duration-500" style={{ transform: isHovered ? "translateY(-2px)" : "translateY(0)" }}>
          <text
            x="0"
            y="45"
            fontSize="48"
            fontWeight="800"
            fontFamily="Inter, system-ui, sans-serif"
            fill={colors.cyan}
          >
            S
          </text>
        </g>

        {/* E */}
        <g className="transition-transform duration-500" style={{ transform: isHovered ? "translateY(2px)" : "translateY(0)", transitionDelay: "50ms" }}>
          <text
            x="32"
            y="45"
            fontSize="48"
            fontWeight="800"
            fontFamily="Inter, system-ui, sans-serif"
            fill={colors.magenta}
          >
            E
          </text>
        </g>

        {/* C */}
        <g className="transition-transform duration-500" style={{ transform: isHovered ? "translateY(-2px)" : "translateY(0)", transitionDelay: "100ms" }}>
          <text
            x="64"
            y="45"
            fontSize="48"
            fontWeight="800"
            fontFamily="Inter, system-ui, sans-serif"
            fill={colors.green}
          >
            C
          </text>
        </g>

        {/* T */}
        <g className="transition-transform duration-500" style={{ transform: isHovered ? "translateY(2px)" : "translateY(0)", transitionDelay: "150ms" }}>
          <text
            x="98"
            y="45"
            fontSize="48"
            fontWeight="800"
            fontFamily="Inter, system-ui, sans-serif"
            fill={colors.orange}
          >
            T
          </text>
        </g>

        {/* I */}
        <g className="transition-transform duration-500" style={{ transform: isHovered ? "translateY(-2px)" : "translateY(0)", transitionDelay: "200ms" }}>
          <text
            x="130"
            y="45"
            fontSize="48"
            fontWeight="800"
            fontFamily="Inter, system-ui, sans-serif"
            fill={colors.blue}
          >
            I
          </text>
        </g>

        {/* Hub badge */}
        <g className="transition-all duration-300" style={{ opacity: isHovered ? 1 : 0.8 }}>
          <rect
            x="148"
            y="22"
            width="48"
            height="24"
            rx="12"
            fill={colors.red}
          />
          <text
            x="172"
            y="39"
            fontSize="12"
            fontWeight="700"
            fontFamily="Inter, system-ui, sans-serif"
            fill="white"
            textAnchor="middle"
          >
            HUB
          </text>
        </g>
      </svg>

      {/* Glow effect on hover */}
      {isHovered && (
        <div 
          className="absolute -inset-4 -z-10 blur-2xl opacity-30 transition-opacity duration-500"
          style={{
            background: `linear-gradient(135deg, ${colors.cyan}, ${colors.magenta}, ${colors.green})`,
          }}
        />
      )}
    </div>
  )
}
