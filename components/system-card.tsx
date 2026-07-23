"use client"

import { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import Image, { type StaticImageData } from "next/image"
import { ArrowUpRight, Maximize2, X, ExternalLink, Loader2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface SystemCardProps {
  title: string
  description: string
  url: string
  color: string
  icon: LucideIcon
  index: number
  image?: string | StaticImageData
  tag?: string
  numberOffset?: number
  highlight?: boolean
}

function getMshotsPreview(url: string) {
  const normalizedUrl = url.replace(/^http:\/\//i, "https://")
  return `https://s.wordpress.com/mshots/v1/${normalizedUrl}?w=1200`
}

export function SystemCard({ title, description, url, color, icon: Icon, index, image, tag, numberOffset = 0, highlight }: SystemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [iframeAllowed, setIframeAllowed] = useState<boolean | null>(null)
  const [iframeCheckError, setIframeCheckError] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const previewCandidates = useMemo<Array<string | StaticImageData>>(() => {
    if (image) {
      return [image]
    }

    return [getMshotsPreview(url)]
  }, [image, url])
  const previewSrc = previewCandidates[previewIndex] ?? previewCandidates[0]

  const hostname = useMemo(() => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }, [url])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isExpanded])

  useEffect(() => {
    setPreviewIndex(0)
    setIsLoading(true)
    setHasError(false)
    setIframeAllowed(null)
    setIframeCheckError(false)
  }, [image, url])

  useEffect(() => {
    if (!isExpanded || image) {
      return
    }

    let cancelled = false

    const checkIframePermission = async () => {
      try {
        const response = await fetch(`/api/frame-check?url=${encodeURIComponent(url)}`)
        if (!response.ok) {
          throw new Error("frame check failed")
        }

        const result = await response.json() as { allowed: boolean }
        if (cancelled) return

        setIframeAllowed(result.allowed)
        setIframeCheckError(!result.allowed)
      } catch {
        if (cancelled) return

        setIframeAllowed(false)
        setIframeCheckError(true)
      }
    }

    checkIframePermission()

    return () => {
      cancelled = true
    }
  }, [isExpanded, image, url])

  const handlePreviewLoad = () => {
    setHasError(false)
    setIsLoading(false)
  }

  const handlePreviewError = () => {
    const canTryAnotherSource = previewIndex < previewCandidates.length - 1

    if (canTryAnotherSource) {
      setPreviewIndex((currentIndex) => currentIndex + 1)
      setIsLoading(true)
      setHasError(false)
      return
    }

    setIsLoading(false)
    setHasError(true)
  }

  return (
    <>
      <article
        className="group flex h-full animate-fade-in flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors duration-300"
        style={{
          animationDelay: `${index * 80}ms`,
          borderColor: isHovered ? `${color}66` : undefined,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Preview */}
        <div className="relative aspect-[16/10] overflow-hidden border-b border-border bg-muted">
          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted pointer-events-none">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Carregando preview…</span>
              </div>
            </div>
          )}

          {/* Error state / Fallback */}
          {hasError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-center">
                <Icon className="h-6 w-6 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground">Preview indisponível</p>
              </div>
            </div>
          ) : (
            <Image
              key={`${title}-${previewIndex}`}
              src={previewSrc}
              alt={`Preview do sistema ${title}`}
              fill
              className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              onLoad={handlePreviewLoad}
              onError={handlePreviewError}
              loading={index === 0 ? "eager" : "lazy"}
              unoptimized
            />
          )}

          {/* Action buttons on hover */}
          <div className="absolute bottom-3 right-3 z-20 flex translate-y-1 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              onClick={() => setIsExpanded(true)}
              aria-label={`Expandir preview de ${title}`}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-border bg-background/95 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir ${title} em nova aba`}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background/95 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5" style={{ backgroundColor: color }} />
              {tag}
            </span>
            <span>{String(index + 1).padStart(2, "0")}</span>
          </div>

          <h3 className="mt-3 text-lg font-semibold tracking-tight">{title}</h3>

          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {description}
          </p>

          {hasError && (
            <p className="mt-2 text-xs text-muted-foreground/80">
              Não foi possível carregar a captura deste site. Use o link abaixo para abrir o sistema.
            </p>
          )}

          <div aria-hidden className="mt-auto min-h-5" />

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <span className="truncate font-mono text-xs text-muted-foreground">{hostname}</span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group/link inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-foreground"
            >
              Acessar
              <ArrowUpRight
                className="h-4 w-4 transition-all duration-300 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
                style={{ color: isHovered ? color : undefined }}
              />
            </a>
          </div>
        </div>
      </article>

      {/* Fullscreen Modal */}
      {isExpanded && isMounted && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-fade-in"
          onClick={() => setIsExpanded(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
          
          {/* Modal */}
          <div 
            className="relative w-full max-w-7xl h-[90vh] rounded-2xl overflow-hidden bg-white shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 md:p-5 bg-gradient-to-b from-black/50 to-transparent"
            >
              <div className="flex items-center gap-4">
                <div 
                  className="p-2.5 rounded-xl"
                  style={{ backgroundColor: color }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{title}</h3>
                  <p className="text-white/60 text-sm">{hostname}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-medium hover:bg-white/30 transition-colors backdrop-blur-sm"
                >
                  Abrir em nova aba
                  <ArrowUpRight className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="cursor-pointer   p-2.5 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors backdrop-blur-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Fullscreen content */}
            {image ? (
              <div className="relative w-full h-full bg-muted">
                <Image
                  src={image}
                  alt={title}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="relative w-full h-full bg-muted">
                {iframeAllowed === null ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                    <Loader2 className="w-10 h-10 animate-spin" style={{ color }} />
                    <p className="text-sm text-muted-foreground">
                      Verificando permissão para exibir este sistema em iframe...
                    </p>
                  </div>
                ) : iframeAllowed ? (
                  <iframe
                    src={url}
                    title={title}
                    className="w-full h-full border-0"
                    onError={() => {
                      setIframeAllowed(false)
                      setIframeCheckError(true)
                    }}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                    <div className="mb-4 rounded-2xl p-4" style={{ backgroundColor: `${color}20` }}>
                      <Icon className="w-8 h-8" style={{ color }} />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground mb-2">Iframe bloqueado</h4>
                    <p className="text-sm text-muted-foreground mb-6">
                      Este site não permite ser exibido em iframe. Abra-o diretamente em uma nova aba.
                    </p>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                    >
                      Abrir em nova aba
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
