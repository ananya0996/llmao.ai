"use client"

import { useEffect } from "react"

interface KeyboardShortcutsProps {
  onToggleSearch?: () => void
  onNavigateNext?: () => void
  onNavigatePrev?: () => void
  onCloseSearch?: () => void
  onExportChat?: () => void
  onToggleTheme?: () => void
  isSearchOpen?: boolean
}

export function KeyboardShortcuts({
  onToggleSearch,
  onNavigateNext,
  onNavigatePrev,
  onCloseSearch,
  onExportChat,
  onToggleTheme,
  isSearchOpen,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + F to open search
      if ((event.ctrlKey || event.metaKey) && event.key === "f") {
        event.preventDefault()
        onToggleSearch?.()
      }

      // Ctrl/Cmd + E to export chat
      if ((event.ctrlKey || event.metaKey) && event.key === "e") {
        event.preventDefault()
        onExportChat?.()
      }

      // Ctrl/Cmd + D to toggle dark mode
      if ((event.ctrlKey || event.metaKey) && event.key === "d") {
        event.preventDefault()
        onToggleTheme?.()
      }

      // Escape to close search
      if (event.key === "Escape" && isSearchOpen) {
        onCloseSearch?.()
      }

      // Enter or F3 to navigate search results
      if (isSearchOpen && (event.key === "Enter" || event.key === "F3")) {
        event.preventDefault()
        if (event.shiftKey) {
          onNavigatePrev?.()
        } else {
          onNavigateNext?.()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onToggleSearch, onNavigateNext, onNavigatePrev, onCloseSearch, onExportChat, onToggleTheme, isSearchOpen])

  return null
}
