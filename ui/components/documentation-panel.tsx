"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  FileText,
  Search,
  ChevronRight,
  ChevronDown,
  X,
  Book,
  Code,
  Settings,
  Database,
  Globe,
  BookOpen,
  Zap,
  Loader2,
} from "lucide-react"

interface DocumentationPanelProps {
  repoUrl?: string
  onCollapse: () => void
  isPublic?: boolean
}

interface DocSection {
  id: string
  title: string
  content: string
}

interface Documentation {
  title: string
  content: string
  sections: DocSection[]
}

export function DocumentationPanel({ repoUrl, onCollapse, isPublic = false }: DocumentationPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [documentation, setDocumentation] = useState<Documentation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch documentation from API
  useEffect(() => {
    const fetchDocumentation = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/documentation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            repoUrl: repoUrl,
            isPublic: isPublic,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to fetch documentation")
        }

        const data = await response.json()
        setDocumentation(data.documentation)
        
        // Auto-expand first section and select it
        if (data.documentation.sections.length > 0) {
          setExpandedSections(new Set([data.documentation.sections[0].id]))
          setSelectedSection(data.documentation.sections[0].id)
        }
      } catch (err) {
        console.error("Error fetching documentation:", err)
        setError("Failed to load documentation")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocumentation()
  }, [repoUrl, isPublic])

  // Filter sections based on search query
  const filteredSections = useMemo(() => {
    if (!documentation) return []
    
    if (!searchQuery.trim()) {
      return documentation.sections
    }

    const query = searchQuery.toLowerCase()
    return documentation.sections.filter(section => 
      section.title.toLowerCase().includes(query) || 
      section.content.toLowerCase().includes(query)
    )
  }, [documentation, searchQuery])

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(sectionId)) {
        newExpanded.delete(sectionId)
      } else {
        newExpanded.add(sectionId)
      }
      return newExpanded
    })
  }, [])

  const selectSection = useCallback((sectionId: string) => {
    setSelectedSection(sectionId)
  }, [])

  const getSelectedContent = () => {
    if (!documentation) return null
    return documentation.sections.find(section => section.id === selectedSection) || null
  }

  const getIconForSection = (title: string) => {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes('overview') || lowerTitle.includes('introduction')) return Book
    if (lowerTitle.includes('setup') || lowerTitle.includes('installation') || lowerTitle.includes('configuration')) return Settings
    if (lowerTitle.includes('api') || lowerTitle.includes('endpoint')) return Code
    if (lowerTitle.includes('feature') || lowerTitle.includes('component')) return Zap
    if (lowerTitle.includes('database') || lowerTitle.includes('storage')) return Database
    if (lowerTitle.includes('deployment') || lowerTitle.includes('production')) return Globe
    if (lowerTitle.includes('guide') || lowerTitle.includes('tutorial')) return BookOpen
    return FileText
  }

  const renderSection = (section: DocSection) => {
    const isExpanded = expandedSections.has(section.id)
    const isSelected = selectedSection === section.id
    const Icon = getIconForSection(section.title)

    return (
      <div key={section.id} className="select-none">
        <div
          className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
            isSelected
              ? "bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 shadow-sm"
              : "hover:bg-muted/50 hover:shadow-sm"
          }`}
          onClick={() => selectSection(section.id)}
        >
          <Icon
            className={`w-4 h-4 transition-colors ${isSelected ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground group-hover:text-foreground"}`}
          />
          <span className="text-sm font-medium flex-1 transition-colors">{section.title}</span>
          <div className="w-4 h-4 flex items-center justify-center">
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground transition-transform" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground transition-transform" />
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-1 ml-6 animate-fade-in">
            <div className="text-xs text-muted-foreground px-3 py-2 leading-relaxed">
              {section.content.length > 150 
                ? `${section.content.substring(0, 150)}...` 
                : section.content
              }
            </div>
          </div>
        )}
      </div>
    )
  }

  const selectedContent = getSelectedContent()

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-background border-r">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Documentation</h2>
            <Button variant="ghost" size="sm" onClick={onCollapse}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading documentation...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex flex-col bg-background border-r">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Documentation</h2>
            <Button variant="ghost" size="sm" onClick={onCollapse}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-2">Failed to load documentation</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background border-r">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Documentation</h2>
          <Button variant="ghost" size="sm" onClick={onCollapse} className="hover:bg-muted/50">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9 text-sm border-border focus:border-purple-300 dark:focus:border-purple-600 bg-background/50"
          />
        </div>

        {/* Connection Status */}
        {!isPublic && (
          <div className="text-xs text-muted-foreground">
            <p className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Repository: {repoUrl?.split("/").pop() || "Not connected"}
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Navigation Sidebar */}
        <div className="w-64 border-r bg-muted/20">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-1">
              {filteredSections.map((section) => renderSection(section))}
              {filteredSections.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {searchQuery ? `No results found for "${searchQuery}"` : "No documentation available"}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <ScrollArea className="h-full">
            <div className="p-6">
              {selectedContent ? (
                <div className="animate-fade-in">
                  <div className="flex items-center space-x-2 mb-6">
                    <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    <h1 className="text-2xl font-bold">{selectedContent.title}</h1>
                  </div>

                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="text-muted-foreground leading-relaxed text-base whitespace-pre-wrap">
                      {selectedContent.content}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div className="max-w-md">
                    <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold mb-3">Select a Section</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Choose a documentation section from the sidebar to view its content.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
