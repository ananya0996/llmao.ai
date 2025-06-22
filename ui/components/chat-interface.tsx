"use client"

import React from "react"
import type { FormEvent } from "react"
import type { Message } from "ai"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, User, Sparkles, Search, X, ChevronUp, ChevronDown } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface ChatInterfaceProps {
  messages: Message[]
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  title: string
}

interface SearchResult {
  messageId: string
  messageIndex: number
  content: string
  role: string
  matchStart: number
  matchEnd: number
}

export function ChatInterface({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  title,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Memoize visible messages to prevent unnecessary recalculations
  const visibleMessages = React.useMemo(() => {
    return messages.filter((message) => message.role !== "system")
  }, [messages])

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1)
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)

  // Animation state
  const [typingText, setTypingText] = useState("")
  const [showTypingIndicator, setShowTypingIndicator] = useState(false)

  const scrollToBottom = React.useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [])

  const scrollToMessage = React.useCallback((messageIndex: number) => {
    const messageElements = messagesContainerRef.current?.querySelectorAll("[data-message-index]")
    if (messageElements && messageElements[messageIndex]) {
      messageElements[messageIndex].scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [])

  // Enhanced typing indicator
  useEffect(() => {
    if (isLoading) {
      setShowTypingIndicator(true)
      const dots = ["", ".", "..", "..."]
      let index = 0

      const interval = setInterval(() => {
        setTypingText(`LLMAO is thinking${dots[index]}`)
        index = (index + 1) % dots.length
      }, 500)

      return () => clearInterval(interval)
    } else {
      setShowTypingIndicator(false)
      setTypingText("")
    }
  }, [isLoading])

  // Scroll to bottom when new messages arrive and search is not open
  useEffect(() => {
    if (!isSearchOpen && visibleMessages.length > 0) {
      const timeoutId = setTimeout(scrollToBottom, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [visibleMessages.length, isSearchOpen, scrollToBottom])

  // Search functionality
  const performSearch = React.useCallback(
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
      setCurrentSearchIndex(results.length > 0 ? 0 : -1)

      if (results.length > 0) {
        setHighlightedMessageId(results[0].messageId)
        scrollToMessage(results[0].messageIndex)
      }
    },
    [visibleMessages, scrollToMessage],
  )

  const navigateSearch = React.useCallback(
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

  const highlightText = React.useCallback(
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

  const closeSearch = React.useCallback(() => {
    setIsSearchOpen(false)
    setSearchQuery("")
    setSearchResults([])
    setCurrentSearchIndex(-1)
    setHighlightedMessageId(null)
  }, [])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, performSearch])

  // Enhanced form submission to ensure messages persist
  const handleFormSubmit = React.useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      if (!input.trim() || isLoading) {
        return
      }

      // Store the input value before submission
      const currentInput = input.trim()

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
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="flex items-center space-x-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </div>

          {/* Search Bar */}
          {isSearchOpen && (
            <div className="mt-4 animate-fade-in">
              <div className="flex items-center space-x-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search through chat history..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 bg-transparent focus:ring-0 focus:outline-none"
                  autoFocus
                />

                {searchResults.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
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
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesContainerRef}>
        <div className="max-w-4xl mx-auto">
          {visibleMessages.length === 0 && !showTypingIndicator && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 animate-fade-in">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Ready to help!</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                Ask me anything about your documentation. I'm here to provide instant, intelligent answers.
              </p>
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
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1 animate-pulse">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={`max-w-[80%] p-4 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white ml-auto transform hover:scale-[1.02]"
                    : "bg-white/95 dark:bg-slate-800/95 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700 transform hover:scale-[1.01]"
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
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-muted-foreground font-medium">{typingText}</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Enhanced Input Area */}
      <div className="border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleFormSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                placeholder="Ask me anything..."
                className="h-12 pr-12 border-2 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm transition-all duration-200 focus:shadow-lg"
                disabled={isLoading}
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
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
