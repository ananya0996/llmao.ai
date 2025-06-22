"use client"

import type { ReactNode } from "react"

// Simplified auth provider that doesn't use NextAuth
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}
