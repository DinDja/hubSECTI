"use client"

import { useState, useEffect, useRef } from "react"
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

export function SystemCard({ title, description, url, color, icon: Icon, index, image }: SystemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

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
    if (image || !isLoading || hasError) return

    // Alguns domínios bloqueiam preview em iframe sem disparar onError.
    // O timeout evita loader infinito e libera ação de abrir o sistema.
    const timeoutId = window.setTimeout(() => {
      setHasError(true)
      setIsLoading(false)
    }, 8000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [image, isLoading, hasError, url])

  const handleIframeLoad = () => {
    setHasError(false)
    setIsLoading(false)
  }

  const handleIframeError = () => {
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
          ) : image ? (
            <div className="absolute inset-0">
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover"
                onLoadingComplete={() => setIsLoading(false)}
                onError={() => handleIframeError()}
              />
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={url}
              title={title}
              className="w-full h-full border-0 pointer-events-none"
              style={{
                transform: "scale(0.5)",
                transformOrigin: "top left",
                width: "200%",
                height: "200%",
              }}
              loading="lazy"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          )}
          
          {/* Hover overlay */}
          <div 
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"
          />

          {/* Action buttons on hover */}
          <div className="absolute inset-0 z-20 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <button
              onClick={() => setIsExpanded(true)}
              className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-foreground text-sm font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <Maximize2 className="w-4 h-4" />
              Expandir
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
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
              Preview indisponivel para este dominio. Use o botao abaixo para abrir o sistema.
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
                  className="p-2.5 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors backdrop-blur-sm"
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
              <iframe
                src={url}
                title={title}
                className="w-full h-full border-0"
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}
