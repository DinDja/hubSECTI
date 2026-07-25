"use client"

import { useEffect, useRef, useState } from "react"
import { X, ArrowUp } from "lucide-react"

const DURATION_MS = 6200
const MAX_DPR = 2

// Geometria da cena (em % do hero, interpretado pelo canvas)
const START_PX = 0.78
const START_PY = 0.11
const END_PX = 0.50
const END_PY = 0.41

// Cor principal do fruto / acento do banner
const ACCENT = "#00B5AD"

// ------------------------------------------------------------------
// Utils de easing
// ------------------------------------------------------------------
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

// Spring simples para a entrada do fruto (pop com overshoot e settle)
function springPop(t: number) {
  if (t <= 0) return 0
  if (t >= 1) return 1
  const c = 0.85
  return 1 + Math.exp(-8 * t) * Math.cos(8 * t * Math.PI) * (1 - c)
}

// Interpolação de pontos em Bézier cúbica com 2 control points
function bezier(
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number
) {
  const u = 1 - t
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}

// ------------------------------------------------------------------
// Tipos de dados da cena
// ------------------------------------------------------------------
type LeafSpec = {
  // angulo inicial (radianos) e distancia do fruto no plano local
  angle: number
  dist: number
  // rotação visual própria da folha (deg)
  rot: number
  // atraso relativo (0..1) em que a folha entra em cena durante a fase de conveingência
  enterAt: number
  // quanto tempo a folha flutua atrás do fruto durante o voo
  liftAmt: number // quanto ela "sustenta" por baixo
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

  // Loop de animação
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

      // ----------------- posições em pixels -----------------
      const startX = START_PX * W
      const startY = START_PY * H
      const endX = END_PX * W
      const endY = END_PY * H

      // ----------------- fases -----------------
      // 0..0.18 — fruto cresce na árvore (spring pop + settle)
      // 0.18..0.32 — folhas convergem
      // 0.32..0.78 — voo em arco com sway
      // 0.78..0.94 — morph contínuo (fruto -> banner)
      // 0.94..1 — entrega (banner já mostrado; canvas limpa)

      // ----------------- posição do fruto -----------------
      let fruitX = startX
      let fruitY = startY
      let swayX = 0
      let swayY = 0

      if (t < 0.18) {
        // ainda na árvore
        const ts = t / 0.18
        const pop = springPop(ts)
        // leve flutuação de "respiração"
        swayX = Math.sin(ts * Math.PI * 4) * 1.2 * (1 - ts)
        swayY = Math.cos(ts * Math.PI * 5) * 1.0 * (1 - ts)
        fruitX += swayX
        fruitY += swayY
        // armazena em ref para uso em shadows
        fruitRef.current.pop = pop
      } else if (t < 0.32) {
        // continua na árvore, mas agora recebe folhas
        const tt = (t - 0.18) / 0.14
        // pequeno bobbing enquanto folhas convergem
        swayX = Math.sin(tt * Math.PI * 6) * 1.6
        swayY = Math.cos(tt * Math.PI * 5) * 1.2
        fruitX += swayX
        fruitY += swayY
      } else if (t < 0.78) {
        // voo: bezier entre start e end, com sway lateral decaying
        const tt = (t - 0.32) / 0.46
        // bezier params — caminho que sobe primeiro, depois desce
        const bx = bezier(tt, startX, startX - 60, (startX + endX) / 2 - 20, endX)
        const by = bezier(tt, startY, startY - 90, (startY + endY) / 2 - 70, endY)
        // sway lateral que vai morrendo
        const swayAmt = 22 * (1 - tt)
        swayX = Math.sin(tt * Math.PI * 2.2) * swayAmt
        swayY = Math.cos(tt * Math.PI * 1.7) * swayAmt * 0.6
        fruitX = bx + swayX
        fruitY = by + swayY
      } else {
        // morph: mantém posição final
        fruitX = endX
        fruitY = endY
      }

      // ----------------- tamanho + borderRadius do fruto -----------------
      // começa em 64px diâmetro; no morph se estica para 340x160
      let fruitW = 64
      let fruitH = 64
      let fruitRadius = 32 // = width/2 (círculo)
      let fruitOpacity = 1

      if (t < 0.18) {
        // grow-in via spring pop
        const ts = t / 0.18
        const pop = springPop(ts)
        fruitW = 64 * pop
        fruitH = 64 * pop
        fruitRadius = fruitW / 2
      } else if (t < 0.78) {
        // constante durante convergência e voo
        fruitW = 64
        fruitH = 64
        fruitRadius = 32
      } else {
        // morph contínuo
        const tm = (t - 0.78) / 0.16
        const ease = easeInOutCubic(tm)
        // squash + stretch natural
        fruitW = 64 + ease * (340 - 64)
        fruitH = 64 + ease * (170 - 64)
        fruitRadius = 32 * (1 - ease) + 12 * ease
      }

      // ----------------- desenhar glow sob o fruto -----------------
      if (t < 0.94) {
        const glowRadius = Math.max(fruitW, fruitH) * 1.5
        const grad = ctx.createRadialGradient(
          fruitX,
          fruitY,
          0,
          fruitX,
          fruitY,
          glowRadius
        )
        grad.addColorStop(0, "rgba(0,181,173,0.35)")
        grad.addColorStop(0.55, "rgba(0,181,173,0.10)")
        grad.addColorStop(1, "rgba(0,181,173,0)")
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(fruitX, fruitY, glowRadius, 0, Math.PI * 2)
        ctx.fill()
      }

      // ----------------- desenhar trail de vento atrás do fruto durante o voo -----------------
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

      // ----------------- desenhar folhas -----------------
      // As folhas têm 3 estados:
      //  1) pre-enter: invisíveis
      //  2) converge: deslizam da copa até perto do fruto
      //  3) carry: orbitam e "sustentam" o fruto durante o voo
      const leaves = leavesRef.current
      for (let i = 0; i < leaves.length; i++) {
        const leaf = leaves[i]
        // progresso de cada folha individualmente
        const leafT = clamp01((t - leaf.enterAt) / 0.18)
        if (leafT <= 0) continue

        // posição inicial: ponto na copa da árvore (leve variação por folha)
        const treeX = startX + Math.cos(leaf.angle) * (leaf.dist + 60)
        const treeY = startY - 40 + Math.sin(leaf.angle) * (leaf.dist * 0.7)

        // posição relativa ao fruto em carry
        const carryX = Math.cos(leaf.angle) * (fruitW / 2 + 8 + leaf.liftAmt * 0.4)
        const carryY = Math.sin(leaf.angle) * (fruitH / 2 + 8 + leaf.liftAmt * 0.4) + leaf.liftAmt * 0.8

        // interpolação entre posição da árvore e posição carry conforme leafT
        const progress = easeOutCubic(leafT)
        const leafX = treeX + (fruitX + carryX - treeX) * progress
        const leafY = treeY + (fruitY + carryY - treeY) * progress

        // sway próprio da folha durante voo
        let leafSwayX = 0
        let leafSwayY = 0
        if (t >= 0.32 && t < 0.78) {
          const tt = (t - 0.32) / 0.46
          const amp = 8 * (1 - tt * 0.5)
          leafSwayX = Math.sin(tt * Math.PI * leaf.swayFreq + leaf.swayPhase) * amp
          leafSwayY = Math.cos(tt * Math.PI * (leaf.swayFreq * 0.7) + leaf.swayPhase) * amp * 0.7
        }

        // folhas desaparecem durante o morph (78%+)
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

        // desenha folha como bezier em formato de gota
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
        // veia central
        ctx.beginPath()
        ctx.moveTo(-3, 9)
        ctx.lineTo(3, -7)
        ctx.strokeStyle = "rgba(255,255,255,0.65)"
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.restore()
      }

      // ----------------- desenhar fruto (ou morph) -----------------
      // só desenha até 94% — depois entrega pro banner
      if (t < 0.94) {
        ctx.save()
        ctx.translate(fruitX, fruitY)
        // squash-and-stretch: leve wobble durante voo
        let sqX = 1
        let sqY = 1
        if (t >= 0.32 && t < 0.78) {
          const tt = (t - 0.32) / 0.46
          sqX = 1 + Math.sin(tt * Math.PI * 4) * 0.04
          sqY = 1 + Math.cos(tt * Math.PI * 3) * 0.03
        }
        ctx.scale(sqX, sqY)

        // gradiente do fruto
        const fgrad = ctx.createRadialGradient(-fruitW * 0.25, -fruitH * 0.25, 0, 0, 0, Math.max(fruitW, fruitH) / 2)
        fgrad.addColorStop(0, "#00E5DC")
        fgrad.addColorStop(0.55, ACCENT)
        fgrad.addColorStop(1, "#00786F")

        ctx.fillStyle = fgrad
        ctx.shadowColor = "rgba(0,110,105,0.4)"
        ctx.shadowBlur = 24
        ctx.shadowOffsetY = 8

        // rounded rect com radius interpolado
        roundRect(ctx, -fruitW / 2, -fruitH / 2, fruitW, fruitH, fruitRadius)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.shadowOffsetY = 0

        // stroke externo sutil
        ctx.strokeStyle = "rgba(255,255,255,0.5)"
        ctx.lineWidth = 2
        ctx.stroke()

        // shine interno
        ctx.beginPath()
        ctx.arc(-fruitW * 0.22, -fruitH * 0.28, fruitH * 0.1, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(255,255,255,0.92)"
        ctx.fill()

        // durante morph, desenhar preview do conteúdo do banner desfocado dentro
        if (t >= 0.78) {
          const tm = (t - 0.78) / 0.16
          const fade = clamp01(tm * 1.2)
          ctx.globalAlpha = fade * 0.5
          ctx.fillStyle = "rgba(255,255,255,0.6)"
          // linhas simulando o conteúdo do banner
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

      // ----------------- entrega pro banner -----------------
      if (t >= 0.94 && !bannerTriggered) {
        bannerTriggered = true
        setBannerReady(true)
        // desliga o canvas depois de mais um tempo
        setTimeout(() => {
          if (canvasRef.current) {
            canvasRef.current.style.opacity = "0"
          }
        }, 400)
      }

      // continua o loop enquanto t < 1
      if (t < 1) {
        rafRef.current = requestAnimationFrame(draw)
      } else {
        // garante entrega
        if (!bannerTriggered) setBannerReady(true)
        // some canvas
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

      {/* Banner final (HTML, clicável) */}
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
        <button
          className="hero-guia-close"
          aria-label="Fechar"
          onClick={(e) => {
            e.stopPropagation()
            dismiss()
          }}
        >
          <X className="hero-guia-close-icon" />
        </button>
        <div className="hero-guia-banner-body">
          <div className="hero-guia-eyebrow">
            <span className="hero-guia-eyebrow-dot" />
            <span>GUIÁ · 01</span>
          </div>
          <h3 className="hero-guia-title">Converse com o assistente</h3>
          <p className="hero-guia-text">
            Pergunte sobre sistemas, projetos, Conecta Bahia e territórios.
          </p>
          <div className="hero-guia-actions">
            <span className="hero-guia-cta">
              Conversar
              <ArrowUp className="hero-guia-cta-icon" />
            </span>
          </div>
        </div>
      </div>

      <style>{GUIA_CSS}</style>
    </div>
  )
}

// Cor por folha — variação natural
function leafColor(i: number): string {
  const palette = ["#8CC63F", "#B2C947", "#6FB42C", "#00B5AD"]
  return palette[i % palette.length]
}

// rounded rect path
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

// Referência para armazenar estado mutável do fruto entre frames
const fruitRef = { current: { pop: 1 } }

const GUIA_CSS = `
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

/* Banner final */
.hero-guia-banner {
  position: absolute;
  left: ${END_PX * 100}%;
  top: ${END_PY * 100}%;
  transform: translate(-50%, -50%);
  width: 340px;
  padding: 22px 24px 20px;
  background: #FCFCFC;
  border: 1px solid rgba(0, 181, 173, 0.4);
  border-left: 4px solid ${ACCENT};
  border-radius: 14px;
  box-shadow:
    0 22px 60px -16px rgba(11, 60, 70, 0.32),
    0 4px 12px -6px rgba(11, 60, 70, 0.18);
  cursor: pointer;
  pointer-events: auto;
  box-sizing: border-box;
  transition: box-shadow 280ms ease, transform 280ms ease, opacity 240ms ease;
}

.hero-guia-banner-hidden {
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, -50%) scale(0.94);
}

.hero-guia-banner-visible {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
  animation: guia-banner-pop 500ms cubic-bezier(.2,.9,.3,1) both;
}

@keyframes guia-banner-pop {
  0%   { transform: translate(-50%, -50%) scale(0.92); opacity: 0; }
  55%  { transform: translate(-50%, -50%) scale(1.02); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

.hero-guia-banner-static {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.hero-guia-banner:hover { box-shadow: 0 28px 70px -14px rgba(11, 60, 70, 0.38); }

.hero-guia-banner-body {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.hero-guia-eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(15, 30, 35, 0.52);
}

.hero-guia-eyebrow-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: ${ACCENT};
  box-shadow: 0 0 0 2px rgba(0, 181, 173, 0.18);
}

.hero-guia-title {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  color: #0F1418;
  letter-spacing: -0.012em;
  line-height: 1.18;
}

.hero-guia-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: rgba(15, 30, 35, 0.64);
}

.hero-guia-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.hero-guia-cta {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #0077C0;
  font-weight: 500;
}

.hero-guia-cta-icon {
  width: 12px; height: 12px;
  transition: transform 240ms ease;
}

.hero-guia-banner:hover .hero-guia-cta-icon {
  transform: rotate(45deg) translateY(1px);
}

.hero-guia-close {
  position: absolute;
  top: 8px; right: 8px;
  width: 24px; height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: rgba(15, 30, 35, 0.4);
  z-index: 2;
}
.hero-guia-close:hover { color: rgba(15, 30, 35, 0.85); }
.hero-guia-close-icon { width: 14px; height: 14px; }

@media (prefers-reduced-motion: reduce) {
  .hero-guia-canvas { display: none; }
  .hero-guia-banner-hidden { opacity: 1; pointer-events: auto; transform: translate(-50%, -50%) scale(1); }
}
`