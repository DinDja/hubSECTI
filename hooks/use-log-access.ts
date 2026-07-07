"use client"

import { useEffect } from "react"

export function useLogAccess(endpoint?: string) {
  useEffect(() => {
    const logAccess = async () => {
      try {
        const response = await fetch("/.netlify/functions/log-access", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: window.location.pathname,
            endpoint: endpoint || window.location.pathname,
            timestamp: new Date().toISOString(),
          }),
        })

        if (!response.ok) {
          console.error("Failed to log access")
        }
      } catch (error) {
        console.error("Error logging access:", error)
      }
    }

    logAccess()
  }, [endpoint])
}