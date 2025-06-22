"use client"

import { useEffect } from "react"

interface SearchShortcutsProps {
  onToggleSearch: () => void
  onNavigateNext: () => void
  onNavigatePrev: () => void
  onCloseSearch: () => void
  isSearchOpen: boolean
}

export function SearchShortcuts({
  onToggleSearch,
  onNavigateNext,
  onNavigatePrev,
  onCloseSearch,
  isSearchOpen,
}: SearchShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + F to open search
      if ((event.ctrlKey || event.metaKey) && event.key === "f") {
        event.preventDefault()
        onToggleSearch()
      }

      // Escape to close search
      if (event.key === "Escape" && isSearchOpen) {
        onCloseSearch()
      }

      // Enter or F3 to navigate to next result
      if (isSearchOpen && (event.key === "Enter" || event.key === "F3")) {
        event.preventDefault()
        if (event.shiftKey) {
          onNavigatePrev()
        } else {
          onNavigateNext()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onToggleSearch, onNavigateNext, onNavigatePrev, onCloseSearch, isSearchOpen])

  return null
}
