"use client"

import { useLogAccess } from "@/hooks/use-log-access"

export function PageAccessLogger() {
  useLogAccess("/")
  return null
}