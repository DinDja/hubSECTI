"use client"

import { useEffect } from "react"

export function useLogAccess(endpoint?: string) {
  useEffect(() => {
    const logAccess = async () => {
      try {
        const url = process.env.NEXT_PUBLIC_LOG_ACCESS_URL || "/api/hub/log-access"
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ip: "",
            path: window.location.pathname,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          }),
        })

        if (!response.ok) {
        }
      } catch {
      }
    }

    logAccess()
  }, [endpoint])
}