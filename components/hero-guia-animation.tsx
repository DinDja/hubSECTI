"use client"

import { useEffect, useRef, useState } from "react"
import { X, ArrowUpRight } from "lucide-react"

const DURATION_MS = 6200
const MAX_DPR = 2

// Geometria da cena
const START_PX = 0.78
const START_PY = 0.11
const END_PX = 0.50
const END_PY = 0.41

const ACCENT = "#00B5AD"

// ------------------------------------------------------------------
// Utils de easing
// ------------------------------------------------------------------
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

function springPop(t: number) {
  if (t <= 0) return 0
  if (t >= 1) return 1
  const c = 0.85
  return 1 + Math.exp(-8 * t) * Math.cos(8 * t * Math.PI) * (1 - c)
}

function bezier(t: number, p0: number, p1: number, p2: number, p3: number) {
  const u = 1 - t
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}

// ------------------------------------------------------------------
// Tipos de dados da cena
// ------------------------------------------------------------------
type LeafSpec = {
  angle: number
  dist: number
  rot: number
  enterAt: number
  liftAmt: number
  swayPhase: number
  swayFreq: number
  size: number
}

const LEAF_COUNT = 10
function makeLeaves(): LeafSpec[] {
  const arr: LeafSpec[] = []
  for (let i = 0; i < LEAF_COUNT; i++) {
    const angle = (i / LEAF_COUNT) * Math.PI * 2 + (i % 3) * 0.18
    arr.push({
      angle,
      dist: 90 + (i % 4) * 22,
      rot: (i * 47) % 360,
      enterAt: 0.15 + (i / LEAF_COUNT) * 0.13,
      liftAmt: 18 + (i % 5) * 6,
      swayPhase: (i / LEAF_COUNT) * Math.PI * 2,
      swayFreq: 2.2 + (i % 4) * 0.4,
      size: 20 + ((i * 7) % 5) * 5,
    })
  }
  return arr
}

// ------------------------------------------------------------------
// Componente principal
// ------------------------------------------------------------------
export function HeroGuiaAnimation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const leavesRef = useRef<LeafSpec[]>([])
  const [bannerReady, setBannerReady] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [skip, setSkip] = useState(false)

  // Init leaves e media query
  useEffect(() => {
    leavesRef.current = makeLeaves()
    const mq = window.matchMedia("(min-width: 1024px)")
    setSkip(!mq.matches)
    const onChange = () => setSkip(!mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  // Loop de animação do canvas (fruto + folhas)
  useEffect(() => {
    if (skip || dismissed) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let dead = false
    let bannerTriggered = false

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect()
      const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1)
      canvas.width = Math.floor(rect.width * dpr)
      canvas.height = Math.floor(rect.height * dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)

    const start = performance.now()
    startRef.current = start

    const draw = (now: number) => {
      if (dead) return
      const elapsed = now - start
      const t = clamp01(elapsed / DURATION_MS)

      const rect = canvas.parentElement!.getBoundingClientRect()
      const W = rect.width
      const H = rect.height

      ctx.clearRect(0, 0, W, H)

      const startX = START_PX * W
      const startY = START_PY * H
      const endX = END_PX * W
      const endY = END_PY * H

      let fruitX = startX
      let fruitY = startY
      let swayX = 0
      let swayY = 0

      if (t < 0.18) {
        const ts = t / 0.18
        const pop = springPop(ts)
        swayX = Math.sin(ts * Math.PI * 4) * 1.2 * (1 - ts)
        swayY = Math.cos(ts * Math.PI * 5) * 1.0 * (1 - ts)
        fruitX += swayX
        fruitY += swayY
        fruitRef.current.pop = pop
      } else if (t < 0.32) {
        const tt = (t - 0.18) / 0.14
        swayX = Math.sin(tt * Math.PI * 6) * 1.6
        swayY = Math.cos(tt * Math.PI * 5) * 1.2
        fruitX += swayX
        fruitY += swayY
      } else if (t < 0.78) {
        const tt = (t - 0.32) / 0.46
        const bx = bezier(tt, startX, startX - 60, (startX + endX) / 2 - 20, endX)
        const by = bezier(tt, startY, startY - 90, (startY + endY) / 2 - 70, endY)
        const swayAmt = 22 * (1 - tt)
        swayX = Math.sin(tt * Math.PI * 2.2) * swayAmt
        swayY = Math.cos(tt * Math.PI * 1.7) * swayAmt * 0.6
        fruitX = bx + swayX
        fruitY = by + swayY
      } else {
        fruitX = endX
        fruitY = endY
      }

      let fruitW = 64
      let fruitH = 64
      let fruitRadius = 32
      let fruitOpacity = 1

      if (t < 0.18) {
        const ts = t / 0.18
        const pop = springPop(ts)
        fruitW = 64 * pop
        fruitH = 64 * pop
        fruitRadius = fruitW / 2
      } else if (t < 0.78) {
        fruitW = 64
        fruitH = 64
        fruitRadius = 32
      } else {
        const tm = (t - 0.78) / 0.16
        const ease = easeInOutCubic(tm)
        fruitW = 64 + ease * (340 - 64)
        fruitH = 64 + ease * (170 - 64)
        fruitRadius = 32 * (1 - ease) + 12 * ease
      }

      if (t < 0.94) {
        const glowRadius = Math.max(fruitW, fruitH) * 1.5
        const grad = ctx.createRadialGradient(fruitX, fruitY, 0, fruitX, fruitY, glowRadius)
        grad.addColorStop(0, "rgba(0,181,173,0.35)")
        grad.addColorStop(0.55, "rgba(0,181,173,0.10)")
        grad.addColorStop(1, "rgba(0,181,173,0)")
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(fruitX, fruitY, glowRadius, 0, Math.PI * 2)
        ctx.fill()
      }

      if (t >= 0.32 && t < 0.78) {
        const tt = (t - 0.32) / 0.46
        const trailCount = 8
        for (let i = 1; i <= trailCount; i++) {
          const tp = clamp01(tt - i * 0.045)
          const trailX = bezier(tp, startX, startX - 60, (startX + endX) / 2 - 20, endX)
          const trailY = bezier(tp, startY, startY - 90, (startY + endY) / 2 - 70, endY)
          const a = 0.12 * (1 - i / trailCount) * (1 - tp)
          if (a <= 0) continue
          const r = Math.max(fruitW, fruitH) * (0.32 - i * 0.03)
          ctx.fillStyle = `rgba(0,181,173,${a})`
          ctx.beginPath()
          ctx.arc(trailX, trailY, r, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      const leaves = leavesRef.current
      for (let i = 0; i < leaves.length; i++) {
        const leaf = leaves[i]
        const leafT = clamp01((t - leaf.enterAt) / 0.18)
        if (leafT <= 0) continue

        const treeX = startX + Math.cos(leaf.angle) * (leaf.dist + 60)
        const treeY = startY - 40 + Math.sin(leaf.angle) * (leaf.dist * 0.7)
        const carryX = Math.cos(leaf.angle) * (fruitW / 2 + 8 + leaf.liftAmt * 0.4)
        const carryY = Math.sin(leaf.angle) * (fruitH / 2 + 8 + leaf.liftAmt * 0.4) + leaf.liftAmt * 0.8
        const progress = easeOutCubic(leafT)
        const leafX = treeX + (fruitX + carryX - treeX) * progress
        const leafY = treeY + (fruitY + carryY - treeY) * progress

        let leafSwayX = 0
        let leafSwayY = 0
        if (t >= 0.32 && t < 0.78) {
          const tt = (t - 0.32) / 0.46
          const amp = 8 * (1 - tt * 0.5)
          leafSwayX = Math.sin(tt * Math.PI * leaf.swayFreq + leaf.swayPhase) * amp
          leafSwayY = Math.cos(tt * Math.PI * (leaf.swayFreq * 0.7) + leaf.swayPhase) * amp * 0.7
        }

        let leafOpacity = 1
        if (t >= 0.78) {
          const tm = clamp01((t - 0.78) / 0.1)
          leafOpacity = 1 - tm
        }
        if (leafOpacity <= 0) continue

        ctx.save()
        ctx.translate(leafX + leafSwayX, leafY + leafSwayY)
        ctx.rotate(((leaf.rot + leafSwayY * 2) * Math.PI) / 180)
        ctx.globalAlpha = leafOpacity
        const s = leaf.size / 24
        ctx.scale(s, s)
        ctx.fillStyle = leafColor(i)
        ctx.strokeStyle = "rgba(255,255,255,0.5)"
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(0, -12)
        ctx.bezierCurveTo(-7, -8, -9, 1, -5, 12)
        ctx.bezierCurveTo(1, 8, 7, -1, 6, -10)
        ctx.bezierCurveTo(3, -13, 1, -13, 0, -12)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(-3, 9)
        ctx.lineTo(3, -7)
        ctx.strokeStyle = "rgba(255,255,255,0.65)"
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.restore()
      }

      if (t < 0.94) {
        ctx.save()
        ctx.translate(fruitX, fruitY)
        let sqX = 1
        let sqY = 1
        if (t >= 0.32 && t < 0.78) {
          const tt = (t - 0.32) / 0.46
          sqX = 1 + Math.sin(tt * Math.PI * 4) * 0.04
          sqY = 1 + Math.cos(tt * Math.PI * 3) * 0.03
        }
        ctx.scale(sqX, sqY)
        const fgrad = ctx.createRadialGradient(-fruitW * 0.25, -fruitH * 0.25, 0, 0, 0, Math.max(fruitW, fruitH) / 2)
        fgrad.addColorStop(0, "#00E5DC")
        fgrad.addColorStop(0.55, ACCENT)
        fgrad.addColorStop(1, "#00786F")
        ctx.fillStyle = fgrad
        ctx.shadowColor = "rgba(0,110,105,0.4)"
        ctx.shadowBlur = 24
        ctx.shadowOffsetY = 8
        roundRect(ctx, -fruitW / 2, -fruitH / 2, fruitW, fruitH, fruitRadius)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.shadowOffsetY = 0
        ctx.strokeStyle = "rgba(255,255,255,0.5)"
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(-fruitW * 0.22, -fruitH * 0.28, fruitH * 0.1, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(255,255,255,0.92)"
        ctx.fill()
        if (t >= 0.78) {
          const tm = (t - 0.78) / 0.16
          const fade = clamp01(tm * 1.2)
          ctx.globalAlpha = fade * 0.5
          ctx.fillStyle = "rgba(255,255,255,0.6)"
          const lineH = 7
          const pad = 22
          roundRect(ctx, -fruitW / 2 + pad, -fruitH / 2 + pad, fruitW - pad * 2, lineH, 3)
          ctx.fill()
          roundRect(ctx, -fruitW / 2 + pad, -fruitH / 2 + pad + 14, (fruitW - pad * 2) * 0.72, lineH, 3)
          ctx.fill()
          roundRect(ctx, -fruitW / 2 + pad, -fruitH / 2 + pad + 28, (fruitW - pad * 2) * 0.55, lineH, 3)
          ctx.fill()
          ctx.globalAlpha = 1
        }
        ctx.restore()
      }

      if (t >= 0.94 && !bannerTriggered) {
        bannerTriggered = true
        setBannerReady(true)
        setTimeout(() => {
          if (canvasRef.current) {
            canvasRef.current.style.opacity = "0"
          }
        }, 400)
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(draw)
      } else {
        if (!bannerTriggered) setBannerReady(true)
        if (canvasRef.current) canvasRef.current.style.opacity = "0"
      }
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      dead = true
      window.removeEventListener("resize", resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [skip, dismissed])

  const dismiss = () => setDismissed(true)
  const openGuia = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("guia:open"))
    }
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <div className="hero-guia-overlay">
      {!skip && (
        <canvas
          ref={canvasRef}
          className="hero-guia-canvas"
          aria-hidden="true"
        />
      )}

      {/* Banner Botânica Digital */}
      <div
        className={`hero-guia-banner ${skip ? "hero-guia-banner-static" : bannerReady ? "hero-guia-banner-visible" : "hero-guia-banner-hidden"}`}
        role="button"
        tabIndex={0}
        onClick={openGuia}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            openGuia()
          }
        }}
      >
        {/* SVG Botânico — fundo */}
        <svg
          className="botanical-svg-bg"
          viewBox="0 0 280 340"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <g className="botanical-sway">
            {/* Caule principal */}
            <path
              className="botanical-stem"
              d="M140 340 Q138 300 142 260 Q146 220 140 180 Q134 140 138 100"
            />
            {/* Folha direita grande */}
            <path
              className="botanical-stem"
              d="M140 220 Q170 200 185 170 Q200 140 190 120 Q180 100 160 110 Q140 120 142 150"
            />
            <path className="botanical-vein" d="M165 165 Q175 155 180 140" />
            <path className="botanical-vein" d="M160 180 Q170 170 175 155" />
            {/* Folha esquerda média */}
            <path
              className="botanical-stem"
              d="M140 260 Q110 240 95 210 Q80 180 90 160 Q100 140 120 150 Q140 160 138 190"
            />
            <path className="botanical-vein" d="M115 205 Q105 195 100 180" />
            {/* Folha direita pequena */}
            <path
              className="botanical-stem"
              d="M138 140 Q160 125 170 105 Q180 85 170 75 Q160 65 148 75 Q136 85 138 105"
            />
            <path className="botanical-vein" d="M155 100 Q162 92 165 82" />
            {/* Folha esquerda pequena */}
            <path
              className="botanical-stem"
              d="M140 180 Q120 165 110 145 Q100 125 108 115 Q116 105 128 115 Q140 125 138 145"
            />
            <path className="botanical-vein" d="M122 140 Q116 132 114 122" />
            {/* Galho com brotos */}
            <path className="botanical-stem" d="M138 100 Q145 80 155 65 Q165 50 175 45" opacity="0.5" />
            <circle cx="175" cy="45" r="2.5" className="botanical-bud" />
            <circle cx="155" cy="65" r="1.5" className="botanical-bud" opacity="0.6" />
            {/* Preenchimento sutil */}
            <path
              className="botanical-fill"
              d="M140 220 Q170 200 185 170 Q200 140 190 120 Q180 100 160 110 Q140 120 142 150 Z"
            />
            <path
              className="botanical-fill"
              d="M140 260 Q110 240 95 210 Q80 180 90 160 Q100 140 120 150 Q140 160 138 190 Z"
            />
          </g>
        </svg>

        <button
          className="hero-guia-close"
          aria-label="Fechar"
          onClick={(e) => {
            e.stopPropagation()
            dismiss()
          }}
        >
          <X className="hero-guia-close-icon" strokeWidth={1.5} />
        </button>

        <div className="hero-guia-banner-body">
          <div className="hero-guia-eyebrow">
            <span className="hero-guia-eyebrow-line" />
            <span>GUIÁ · 01</span>
          </div>
          <h3 className="hero-guia-title">
            Converse com o <em>assistente</em>
          </h3>
          <p className="hero-guia-text">
            Pergunte sobre sistemas, projetos, Conecta Bahia e territórios.
          </p>
          <div className="hero-guia-actions">
            <span className="hero-guia-cta">
              Conversar
              <ArrowUpRight className="hero-guia-cta-icon" strokeWidth={2} />
            </span>
            <span className="hero-guia-index">01</span>
          </div>
        </div>
      </div>

      <style>{GUIA_CSS}</style>
    </div>
  )
}

function leafColor(i: number): string {
  const palette = ["#8CC63F", "#B2C947", "#6FB42C", "#00B5AD"]
  return palette[i % palette.length]
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

const fruitRef = { current: { pop: 1 } }

const GUIA_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap');

.hero-guia-overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  pointer-events: none;
  overflow: hidden;
}

.hero-guia-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  transition: opacity 400ms ease;
}

/* ================================================================
   BANNER BOTÂNICA DIGITAL
   ================================================================ */

.hero-guia-banner {
  position: absolute;
  left: ${END_PX * 100}%;
  top: ${END_PY * 100}%;
  transform: translate(-50%, -50%);
  width: 380px;
  padding: 32px 30px 28px;
  background: #FAFAF8;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  box-shadow: 0 16px 50px -16px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  pointer-events: auto;
  box-sizing: border-box;
  transition: all 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  overflow: hidden;
}

.hero-guia-banner-hidden {
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, -50%) scale(0.96);
}

.hero-guia-banner-visible {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
  animation: botanical-pop 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

@keyframes botanical-pop {
  0%   { transform: translate(-50%, -50%) scale(0.94); opacity: 0; }
  60%  { transform: translate(-50%, -50%) scale(1.01); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

.hero-guia-banner-static {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.hero-guia-banner:hover {
  border-color: rgba(0, 181, 173, 0.15);
  box-shadow: 0 20px 60px -16px rgba(0, 0, 0, 0.12);
}

/* SVG Botânico */
.botanical-svg-bg {
  position: absolute;
  bottom: -30px;
  right: -20px;
  width: 280px;
  height: 340px;
  pointer-events: none;
  z-index: 0;
  opacity: 0.45;
}

.botanical-sway {
  transform-origin: bottom center;
  animation: gentleSway 7s ease-in-out infinite;
}

@keyframes gentleSway {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(1.2deg); }
}

.botanical-stem {
  fill: none;
  stroke: rgba(26, 26, 26, 0.18);
  stroke-width: 0.8;
  stroke-linecap: round;
  stroke-dasharray: 600;
  stroke-dashoffset: 600;
  animation: growStem 2.8s ease-out forwards;
}

.botanical-stem:nth-child(2) { animation-delay: 0.3s; }
.botanical-stem:nth-child(3) { animation-delay: 0.5s; }
.botanical-stem:nth-child(4) { animation-delay: 0.7s; }
.botanical-stem:nth-child(5) { animation-delay: 0.9s; }
.botanical-stem:nth-child(6) { animation-delay: 1.1s; }
.botanical-stem:nth-child(7) { animation-delay: 1.3s; }
.botanical-stem:nth-child(8) { animation-delay: 1.5s; }

@keyframes growStem {
  to { stroke-dashoffset: 0; }
}

.botanical-vein {
  fill: none;
  stroke: rgba(26, 26, 26, 0.1);
  stroke-width: 0.5;
  stroke-linecap: round;
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: growVein 1.5s ease-out 1.8s forwards;
}

.botanical-vein:nth-of-type(2) { animation-delay: 2s; }
.botanical-vein:nth-of-type(3) { animation-delay: 2.2s; }
.botanical-vein:nth-of-type(4) { animation-delay: 2.4s; }

@keyframes growVein {
  to { stroke-dashoffset: 0; }
}

.botanical-bud {
  fill: #00B5AD;
  opacity: 0;
  animation: budAppear 0.6s ease-out 2.6s forwards;
}

.botanical-bud:nth-of-type(2) { animation-delay: 2.8s; }

@keyframes budAppear {
  to { opacity: 0.35; }
}

.botanical-fill {
  fill: rgba(0, 181, 173, 0.04);
  stroke: none;
  opacity: 0;
  animation: fillIn 2s ease-out 2s forwards;
}

.botanical-fill:nth-of-type(2) { animation-delay: 2.3s; }

@keyframes fillIn {
  to { opacity: 1; }
}

/* Conteúdo */
.hero-guia-banner-body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.hero-guia-eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(26, 26, 26, 0.45);
  margin-bottom: 18px;
}

.hero-guia-eyebrow-line {
  width: 20px;
  height: 1.5px;
  background: #00B5AD;
}

.hero-guia-title {
  margin: 0;
  font-family: 'Crimson Pro', serif;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.08;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  margin-bottom: 10px;
}

.hero-guia-title em {
  font-style: italic;
  font-weight: 400;
  color: rgba(26, 26, 26, 0.45);
}

.hero-guia-text {
  margin: 0;
  font-family: 'Crimson Pro', serif;
  font-size: 15px;
  line-height: 1.5;
  color: rgba(26, 26, 26, 0.5);
  max-width: 230px;
  margin-bottom: 22px;
}

.hero-guia-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.hero-guia-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #00786F;
  padding: 8px 16px;
  border: 1px solid rgba(0, 181, 173, 0.2);
  border-radius: 2px;
  transition: all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.hero-guia-banner:hover .hero-guia-cta {
  background: rgba(0, 181, 173, 0.06);
  border-color: rgba(0, 181, 173, 0.35);
}

.hero-guia-cta-icon {
  width: 13px;
  height: 13px;
  transition: transform 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.hero-guia-banner:hover .hero-guia-cta-icon {
  transform: translate(2px, -2px);
}

.hero-guia-index {
  font-family: 'Crimson Pro', serif;
  font-size: 42px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.04);
  line-height: 1;
  user-select: none;
}

.hero-guia-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: rgba(26, 26, 26, 0.25);
  z-index: 2;
  transition: color 200ms ease;
}

.hero-guia-close:hover {
  color: rgba(26, 26, 26, 0.7);
}

.hero-guia-close-icon {
  width: 14px;
  height: 14px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .hero-guia-canvas { display: none; }
  .hero-guia-banner-hidden { opacity: 1; pointer-events: auto; transform: translate(-50%, -50%) scale(1); }
  .botanical-sway { animation: none; }
  .botanical-stem,
  .botanical-vein,
  .botanical-bud,
  .botanical-fill { animation: none; stroke-dashoffset: 0; opacity: 1; }
}
`