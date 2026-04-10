"use client"

import { useState, useEffect, useMemo } from "react"
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
}

function getMshotsPreview(url: string) {
  const normalizedUrl = url.replace(/^http:\/\//i, "https://")
  return `https://s.wordpress.com/mshots/v1/${normalizedUrl}?w=1200`
}

export function SystemCard({ title, description, url, color, icon: Icon, index, image }: SystemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [iframeAllowed, setIframeAllowed] = useState<boolean | null>(null)
  const [iframeCheckError, setIframeCheckError] = useState(false)
  const previewCandidates = useMemo<Array<string | StaticImageData>>(() => {
    if (image) {
      return [image]
    }

    return [getMshotsPreview(url)]
  }, [image, url])
  const previewSrc = previewCandidates[previewIndex] ?? previewCandidates[0]

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
      <div
        className="group relative overflow-hidden rounded-3xl bg-card border border-border transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 animate-fade-in"
        style={{
          animationDelay: `${index * 150}ms`,
          boxShadow: isHovered ? `0 25px 50px -12px ${color}25` : undefined,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Animated color accent bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-1.5 transition-all duration-500"
          style={{ 
            backgroundColor: color,
            transform: isHovered ? "scaleX(1)" : "scaleX(0.3)",
            transformOrigin: "left",
          }}
        />

        {/* Preview iframe container */}
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted z-10 pointer-events-none">
              <div className="flex flex-col items-center gap-3">
                <Loader2 
                  className="w-8 h-8 animate-spin" 
                  style={{ color }} 
                />
                <span className="text-sm text-muted-foreground">Carregando preview...</span>
              </div>
            </div>
          )}

          {/* Error state / Fallback */}
          {hasError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="text-center p-6">
                <div 
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Icon className="w-8 h-8" style={{ color }} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Preview indisponível
                </p>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0">
              <Image
                key={`${title}-${previewIndex}`}
                src={previewSrc}
                alt={`Preview do sistema ${title}`}
                fill
                className="object-cover"
                onLoad={handlePreviewLoad}
                onError={handlePreviewError}
                loading={index === 0 ? "eager" : "lazy"}
                unoptimized
              />
            </div>
          )}
          
          {/* Hover overlay */}
          <div 
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"
          />

          {/* Action buttons on hover */}
          <div className="absolute inset-0 z-20 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <button
              onClick={() => setIsExpanded(true)}
              className="cursor-pointer pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-foreground text-sm font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <Maximize2 className="w-4 h-4" />
              Expandir
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
              style={{ backgroundColor: color }}
            >
              <ExternalLink className="w-4 h-4" />
              Abrir
            </a>
          </div>

          {/* Icon badge */}
          <div 
            className="absolute top-4 left-4 p-3 rounded-xl backdrop-blur-sm transition-all duration-300 group-hover:scale-110"
            style={{ 
              backgroundColor: `${color}30`,
              color: "white",
            }}
          >
            <Icon className="w-6 h-6" />
          </div>

          {/* Status indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm">
            <span 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs font-medium text-foreground">Online</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-5 line-clamp-2">
            {description}
          </p>

          {/* URL indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div 
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="truncate">{new URL(url).hostname}</span>
          </div>

          {hasError && (
            <p className="mt-3 text-xs text-muted-foreground">
              Nao foi possivel carregar a captura deste site. Use o botao abaixo para abrir o sistema.
            </p>
          )}

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:opacity-90"
            style={{ backgroundColor: color }}
          >
            <ExternalLink className="w-4 h-4" />
            Abrir sistema
          </a>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 animate-fade-in"
          onClick={() => setIsExpanded(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
          
          {/* Modal */}
          <div 
            className="relative w-full max-w-7xl h-[90vh] rounded-3xl overflow-hidden bg-white shadow-2xl animate-scale-in"
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
                  <p className="text-white/60 text-sm">{new URL(url).hostname}</p>
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
        </div>
      )}
    </>
  )
}
