"use client"

import type { FormEvent } from "react"
import React, { useEffect, useRef, useState, useCallback } from "react"
import type { Message } from "ai"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThemeToggle } from "@/components/theme-toggle"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import { exportChatToPDF } from "@/lib/pdf-export"
import {
  Send,
  Bot,
  User,
  Brain,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  Menu,
  Maximize2,
  Minimize2,
  Download,
  Keyboard,
  Home,
  Settings,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { DocumentationPanel } from "@/components/documentation-panel"

interface SplitScreenChatProps {
  messages: Message[]
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  title: string
  backUrl: string
  repoUrl?: string
  confUrl?: string
  isPublic?: boolean
}

interface SearchResult {
  messageId: string
  messageIndex: number
  content: string
  role: string
  matchStart: number
  matchEnd: number
}

export function SplitScreenChat({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  title,
  backUrl,
  repoUrl,
  confUrl,
  isPublic = false,
}: SplitScreenChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { setTheme, theme } = useTheme()
  const router = useRouter()

  // Memoize visibleMessages to prevent unnecessary recalculations
  const visibleMessages = React.useMemo(() => {
    return messages.filter((message) => message.role !== "system")
  }, [messages])

  // Layout state
  const [leftPanelWidth, setLeftPanelWidth] = useState(50)
  const [isResizing, setIsResizing] = useState(false)
  const [isDocPanelCollapsed, setIsDocPanelCollapsed] = useState(false)

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1)
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)

  // Enhanced typing indicator state
  const [typingText, setTypingText] = useState("")
  const [showTypingIndicator, setShowTypingIndicator] = useState(false)

  // Simplified navigation handlers
  const handleHomeClick = useCallback(() => {
    // Always go to home page - simple and reliable
    window.location.href = "/"
  }, [])

  const handleReconfigureClick = useCallback(() => {
    // For internal users, clear config and go to setup
    if (!isPublic) {
      sessionStorage.removeItem("llmao_config")
      window.location.href = "/internal"
    }
  }, [isPublic])

  // Enhanced typing indicator effect
  useEffect(() => {
    if (isLoading) {
      setShowTypingIndicator(true)
      const phrases = [
        "LLMAO is analyzing your documentation",
        "LLMAO is searching through knowledge base",
        "LLMAO is generating response",
        "LLMAO is thinking",
      ]
      const dots = ["", ".", "..", "..."]
      let phraseIndex = 0
      let dotIndex = 0

      const interval = setInterval(() => {
        setTypingText(`${phrases[phraseIndex]}${dots[dotIndex]}`)
        dotIndex = (dotIndex + 1) % dots.length

        if (dotIndex === 0) {
          phraseIndex = (phraseIndex + 1) % phrases.length
        }
      }, 400)

      return () => clearInterval(interval)
    } else {
      setShowTypingIndicator(false)
      setTypingText("")
    }
  }, [isLoading])

  // Resize functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      const containerWidth = window.innerWidth
      const newWidth = (e.clientX / containerWidth) * 100
      const constrainedWidth = Math.min(Math.max(newWidth, 25), 75)
      setLeftPanelWidth(constrainedWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing])

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [])

  const scrollToMessage = useCallback((messageIndex: number) => {
    const messageElements = messagesContainerRef.current?.querySelectorAll("[data-message-index]")
    if (messageElements && messageElements[messageIndex]) {
      messageElements[messageIndex].scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [])

  // Scroll to bottom when new messages arrive, but not during search
  useEffect(() => {
    if (!isSearchOpen && messages.length > 0) {
      scrollToBottom()
    }
  }, [messages.length, isSearchOpen, scrollToBottom])

  // Search functionality
  const performSearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setSearchResults([])
        setCurrentSearchIndex(-1)
        setHighlightedMessageId(null)
        return
      }

      const results: SearchResult[] = []
      const searchTerm = query.toLowerCase()

      visibleMessages.forEach((message, index) => {
        const content = message.content.toLowerCase()
        let searchIndex = 0

        while (true) {
          const matchIndex = content.indexOf(searchTerm, searchIndex)
          if (matchIndex === -1) break

          results.push({
            messageId: message.id,
            messageIndex: index,
            content: message.content,
            role: message.role,
            matchStart: matchIndex,
            matchEnd: matchIndex + searchTerm.length,
          })

          searchIndex = matchIndex + 1
        }
      })

      setSearchResults(results)

      if (results.length > 0) {
        setCurrentSearchIndex(0)
        setHighlightedMessageId(results[0].messageId)
        scrollToMessage(results[0].messageIndex)
      } else {
        setCurrentSearchIndex(-1)
        setHighlightedMessageId(null)
      }
    },
    [visibleMessages, scrollToMessage],
  )

  useEffect(() => {
    performSearch(searchQuery)
  }, [searchQuery, performSearch])

  const navigateSearch = useCallback(
    (direction: "next" | "prev") => {
      if (searchResults.length === 0) return

      let newIndex
      if (direction === "next") {
        newIndex = currentSearchIndex < searchResults.length - 1 ? currentSearchIndex + 1 : 0
      } else {
        newIndex = currentSearchIndex > 0 ? currentSearchIndex - 1 : searchResults.length - 1
      }

      setCurrentSearchIndex(newIndex)
      setHighlightedMessageId(searchResults[newIndex].messageId)
      scrollToMessage(searchResults[newIndex].messageIndex)
    },
    [currentSearchIndex, searchResults, scrollToMessage],
  )

  const highlightText = useCallback(
    (text: string, messageId: string) => {
      if (!searchQuery.trim() || highlightedMessageId !== messageId) {
        return text
      }

      const searchTerm = searchQuery.toLowerCase()
      const lowerText = text.toLowerCase()
      const parts = []
      let lastIndex = 0

      let searchIndex = 0
      while (true) {
        const matchIndex = lowerText.indexOf(searchTerm, searchIndex)
        if (matchIndex === -1) break

        if (matchIndex > lastIndex) {
          parts.push(text.slice(lastIndex, matchIndex))
        }

        parts.push(
          <mark
            key={`${messageId}-${matchIndex}`}
            className="bg-yellow-300 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 rounded px-1"
          >
            {text.slice(matchIndex, matchIndex + searchTerm.length)}
          </mark>,
        )

        lastIndex = matchIndex + searchTerm.length
        searchIndex = matchIndex + 1
      }

      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex))
      }

      return parts.length > 0 ? parts : text
    },
    [searchQuery, highlightedMessageId],
  )

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false)
    setSearchQuery("")
    setSearchResults([])
    setCurrentSearchIndex(-1)
    setHighlightedMessageId(null)
  }, [])

  const handleExportChat = useCallback(() => {
    exportChatToPDF(visibleMessages, title)
  }, [visibleMessages, title])

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light")
  }, [theme, setTheme])

  // Enhanced form submission to ensure messages persist
  const handleFormSubmit = React.useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      if (!input.trim() || isLoading) {
        return
      }

      // Call the original submit handler
      handleSubmit(e)

      // Focus back to input after submission
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 100)
    },
    [handleSubmit, input, isLoading],
  )

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
      <KeyboardShortcuts
        onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
        onNavigateNext={() => navigateSearch("next")}
        onNavigatePrev={() => navigateSearch("prev")}
        onCloseSearch={closeSearch}
        onExportChat={handleExportChat}
        onToggleTheme={toggleTheme}
        isSearchOpen={isSearchOpen}
      />

      {/* Documentation Panel */}
      <div
        className={`transition-all duration-300 ${isDocPanelCollapsed ? "w-0" : ""} bg-background border-r shadow-lg`}
        style={{ width: isDocPanelCollapsed ? "0%" : `${leftPanelWidth}%` }}
      >
        {!isDocPanelCollapsed && (
          <DocumentationPanel
            repoUrl={repoUrl}
            confUrl={confUrl}
            onCollapse={() => setIsDocPanelCollapsed(true)}
            isPublic={isPublic}
          />
        )}
      </div>

      {/* Resize Handle */}
      {!isDocPanelCollapsed && (
        <div
          className="w-1 bg-border hover:bg-purple-500 cursor-col-resize transition-colors duration-200 relative group"
          onMouseDown={() => setIsResizing(true)}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-purple-500/20"></div>
        </div>
      )}

      {/* Chat Panel */}
      <div
        className={`flex flex-col transition-all duration-300 ${isDocPanelCollapsed ? "w-full" : ""} bg-background`}
        style={{ width: isDocPanelCollapsed ? "100%" : `${100 - leftPanelWidth}%` }}
      >
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur-sm shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Navigation Buttons */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-background/50 hover:bg-muted"
                    onClick={handleHomeClick}
                    title="Go to Home Page"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Button>

                  {!isPublic && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-background/50 hover:bg-muted"
                      onClick={handleReconfigureClick}
                      title="Reconfigure Settings"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Setup
                    </Button>
                  )}
                </div>

                {isDocPanelCollapsed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDocPanelCollapsed(false)}
                    className="bg-background/50 hover:bg-muted"
                  >
                    <Menu className="w-4 h-4 mr-2" />
                    Show Docs
                  </Button>
                )}

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold">{title}</h1>
                    <p className="text-xs text-muted-foreground">LLMAO Interface</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportChat}
                  className="bg-background/50 hover:bg-muted"
                  disabled={visibleMessages.length === 0}
                  title="Export Chat (Ctrl+E)"
                >
                  <Download className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="bg-background/50 hover:bg-muted"
                  title="Search (Ctrl+F)"
                >
                  <Search className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDocPanelCollapsed(!isDocPanelCollapsed)}
                  className="bg-background/50 hover:bg-muted"
                  title="Toggle Documentation Panel"
                >
                  {isDocPanelCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </Button>

                <ThemeToggle />
              </div>
            </div>

            {/* Search Bar */}
            {isSearchOpen && (
              <div className="mt-4 animate-fade-in">
                <div className="flex items-center space-x-2 bg-background/90 backdrop-blur-sm rounded-xl p-3 border">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search through chat history..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 bg-transparent focus:ring-0 focus:outline-none"
                    autoFocus
                  />

                  {searchResults.length > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span className="whitespace-nowrap">
                        {currentSearchIndex + 1} of {searchResults.length}
                      </span>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigateSearch("prev")}
                          className="h-6 w-6 p-0"
                          disabled={searchResults.length === 0}
                        >
                          <ChevronUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigateSearch("next")}
                          className="h-6 w-6 p-0"
                          disabled={searchResults.length === 0}
                        >
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <Button variant="ghost" size="sm" onClick={closeSearch} className="h-6 w-6 p-0">
                    <X className="w-3 h-3" />
                  </Button>
                </div>

                {searchQuery && searchResults.length === 0 && (
                  <div className="mt-2 text-sm text-muted-foreground text-center">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Navigation Info */}
            <div className="mt-2 flex items-center justify-center">
              <div className="text-xs text-muted-foreground flex items-center space-x-4 bg-muted/30 rounded-full px-3 py-1">
                <span className="flex items-center">
                  <Keyboard className="w-3 h-3 mr-1" />
                  Shortcuts:
                </span>
                <span>Ctrl+F (Search)</span>
                <span>Ctrl+E (Export)</span>
                <span>Ctrl+D (Theme)</span>
                {!isPublic && (
                  <span className="flex items-center">
                    <Settings className="w-3 h-3 mr-1" />
                    Setup to reconfigure
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Messages Container */}
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-4" ref={messagesContainerRef}>
              {visibleMessages.length === 0 && !showTypingIndicator && (
                <div className="flex flex-col items-center justify-center h-full text-center py-16 animate-fade-in">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-100 via-blue-100 to-indigo-100 dark:from-purple-900/30 dark:via-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mb-4">
                    <Brain className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">LLMAO is ready!</h3>
                  <p className="text-muted-foreground max-w-md leading-relaxed">
                    {isDocPanelCollapsed
                      ? "Ask me anything about your documentation. I'm here to provide intelligent answers."
                      : "Browse the documentation and ask questions here. I'll provide intelligent answers based on your docs."}
                  </p>
                  {!isPublic && (
                    <div className="mt-4 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                      <p className="flex items-center justify-center">
                        <Settings className="w-3 h-3 mr-1" />
                        Click "Setup" to reconfigure your GitHub and Confluence URLs
                      </p>
                    </div>
                  )}
                </div>
              )}

              {visibleMessages.map((message, index) => (
                <div
                  key={message.id}
                  data-message-index={index}
                  className={`flex items-start space-x-3 transition-all duration-500 ease-out transform ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  } ${
                    highlightedMessageId === message.id
                      ? "ring-2 ring-yellow-400 dark:ring-yellow-600 ring-opacity-50 rounded-2xl p-2 -m-2"
                      : ""
                  } animate-slide-in`}
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    animationFillMode: "both",
                  }}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1 animate-pulse">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] p-4 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white ml-auto transform hover:scale-[1.02]"
                        : "bg-white/95 dark:bg-card text-gray-900 dark:text-card-foreground border border-gray-100 dark:border-border transform hover:scale-[1.01]"
                    }`}
                  >
                    <div className="prose prose-sm max-w-none dark:prose-invert text-inherit leading-relaxed">
                      {highlightText(message.content, message.id)}
                    </div>
                  </div>

                  {message.role === "user" && (
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {/* Enhanced Typing Indicator */}
              {showTypingIndicator && (
                <div className="flex items-start space-x-3 animate-fade-in">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-card p-4 rounded-2xl border shadow-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-muted-foreground font-medium">{typingText}</span>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Enhanced Input Area */}
        <div className="border-t bg-background/95 backdrop-blur-sm p-6">
          <form onSubmit={handleFormSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                placeholder="Ask LLMAO anything about your documentation..."
                className="h-12 pr-12 border-2 focus:border-purple-500 dark:focus:border-purple-400 rounded-xl bg-background/50 backdrop-blur-sm transition-all duration-200 focus:shadow-lg"
                disabled={isLoading}
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="h-12 px-6 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
