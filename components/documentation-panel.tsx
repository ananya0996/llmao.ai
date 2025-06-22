"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Search,
  ChevronRight,
  ChevronDown,
  Book,
  Code,
  Settings,
  Database,
  Globe,
  X,
  Filter,
  BookOpen,
  Zap,
} from "lucide-react"

interface DocumentationPanelProps {
  repoUrl?: string
  confUrl?: string
  onCollapse: () => void
  isPublic?: boolean
}

interface DocSection {
  id: string
  title: string
  icon: any
  children?: DocSection[]
  content?: string
  category: "getting-started" | "api" | "guides" | "examples"
}

export function DocumentationPanel({ repoUrl, confUrl, onCollapse, isPublic = false }: DocumentationPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["getting-started"]))
  const [selectedSection, setSelectedSection] = useState("introduction")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<string>("all")

  // Mock documentation structure
  const documentationSections: DocSection[] = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: Book,
      category: "getting-started",
      children: [
        {
          id: "introduction",
          title: "Introduction",
          icon: FileText,
          content:
            "Welcome to LLMAO documentation. This comprehensive guide will help you understand and implement our Large Language Model Aided Overflow system effectively.",
          category: "getting-started",
        },
        {
          id: "installation",
          title: "Installation",
          icon: Settings,
          content:
            "Follow these steps to install and configure LLMAO in your environment. We support multiple deployment options including Docker, npm, and cloud platforms.",
          category: "getting-started",
        },
        {
          id: "quick-start",
          title: "Quick Start",
          icon: Zap,
          content:
            "Get up and running with LLMAO in under 5 minutes. This quick start guide covers the essential setup and your first AI-powered documentation query.",
          category: "getting-started",
        },
      ],
    },
    {
      id: "api-reference",
      title: "API Reference",
      icon: Code,
      category: "api",
      children: [
        {
          id: "authentication",
          title: "Authentication",
          icon: Settings,
          content:
            "Learn about LLMAO's authentication methods including API keys, OAuth, and session management for secure access to your documentation.",
          category: "api",
        },
        {
          id: "endpoints",
          title: "Endpoints",
          icon: Globe,
          content:
            "Complete reference of all available API endpoints, including request/response formats, parameters, and example implementations.",
          category: "api",
        },
        {
          id: "webhooks",
          title: "Webhooks",
          icon: Database,
          content:
            "Configure webhooks to receive real-time notifications about documentation updates, chat interactions, and system events.",
          category: "api",
        },
      ],
    },
    {
      id: "guides",
      title: "Guides & Tutorials",
      icon: BookOpen,
      category: "guides",
      children: [
        {
          id: "best-practices",
          title: "Best Practices",
          icon: FileText,
          content:
            "Recommended practices for organizing documentation, optimizing AI responses, and maintaining high-quality knowledge bases.",
          category: "guides",
        },
        {
          id: "examples",
          title: "Code Examples",
          icon: Code,
          content:
            "Practical code examples and implementation patterns for integrating LLMAO into your existing documentation workflow.",
          category: "examples",
        },
        {
          id: "troubleshooting",
          title: "Troubleshooting",
          icon: Settings,
          content:
            "Common issues and their solutions, debugging tips, and how to get help when you encounter problems.",
          category: "guides",
        },
      ],
    },
  ]

  const filterOptions = [
    { value: "all", label: "All", count: 9 },
    { value: "getting-started", label: "Getting Started", count: 3 },
    { value: "api", label: "API Reference", count: 3 },
    { value: "guides", label: "Guides", count: 2 },
    { value: "examples", label: "Examples", count: 1 },
  ]

  // Filter sections based on search and category
  const filteredSections = useMemo(() => {
    let sections = documentationSections

    // Filter by category
    if (selectedFilter !== "all") {
      sections = sections
        .map((section) => ({
          ...section,
          children: section.children?.filter((child) => child.category === selectedFilter),
        }))
        .filter((section) => section.category === selectedFilter || (section.children && section.children.length > 0))
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      sections = sections
        .map((section) => ({
          ...section,
          children: section.children?.filter(
            (child) => child.title.toLowerCase().includes(query) || child.content?.toLowerCase().includes(query),
          ),
        }))
        .filter(
          (section) => section.title.toLowerCase().includes(query) || (section.children && section.children.length > 0),
        )
    }

    return sections
  }, [searchQuery, selectedFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1200)
    return () => clearTimeout(timer)
  }, [])

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
    for (const section of documentationSections) {
      if (section.children) {
        const found = section.children.find((child) => child.id === selectedSection)
        if (found) return found
      }
      if (section.id === selectedSection) return section
    }
    return null
  }

  const renderSection = (section: DocSection, level = 0) => {
    const isExpanded = expandedSections.has(section.id)
    const hasChildren = section.children && section.children.length > 0
    const isSelected = selectedSection === section.id

    return (
      <div key={section.id} className="select-none">
        <div
          className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
            isSelected
              ? "bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 shadow-sm"
              : "hover:bg-muted/50 hover:shadow-sm"
          }`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleSection(section.id)
            } else {
              selectSection(section.id)
            }
          }}
        >
          {hasChildren && (
            <div className="w-4 h-4 flex items-center justify-center">
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-muted-foreground transition-transform" />
              ) : (
                <ChevronRight className="w-3 h-3 text-muted-foreground transition-transform" />
              )}
            </div>
          )}
          {!hasChildren && <div className="w-4" />}

          <section.icon
            className={`w-4 h-4 transition-colors ${isSelected ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground group-hover:text-foreground"}`}
          />
          <span className="text-sm font-medium flex-1 transition-colors">{section.title}</span>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1 animate-fade-in">
            {section.children?.map((child) => renderSection(child, level + 1))}
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
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading documentation...</p>
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

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Filter className="w-3 h-3" />
            <span>Filter by category</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {filterOptions.map((filter) => (
              <Badge
                key={filter.value}
                variant={selectedFilter === filter.value ? "default" : "secondary"}
                className={`cursor-pointer text-xs transition-all hover:scale-105 ${
                  selectedFilter === filter.value ? "bg-purple-600 hover:bg-purple-700 text-white" : "hover:bg-muted"
                }`}
                onClick={() => setSelectedFilter(filter.value)}
              >
                {filter.label} ({filter.count})
              </Badge>
            ))}
          </div>
        </div>

        {/* Connection Status */}
        {!isPublic && (
          <div className="mt-3 text-xs text-muted-foreground space-y-1">
            <p className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Repository: {repoUrl?.split("/").pop() || "Not connected"}
            </p>
            <p className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Confluence: {confUrl ? "Connected" : "Not connected"}
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
                  <p className="text-sm">No results found</p>
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
                    <selectedContent.icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    <h1 className="text-2xl font-bold">{selectedContent.title}</h1>
                  </div>

                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="text-muted-foreground leading-relaxed text-base mb-8">
                      {selectedContent.content || "Content for this section is being loaded..."}
                    </p>

                    {/* Enhanced content sections */}
                    <div className="space-y-8">
                      <div className="bg-muted/30 rounded-xl p-6 border">
                        <h3 className="font-semibold mb-4 flex items-center">
                          <Code className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                          Code Example
                        </h3>
                        <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto border">
                          <code>{`// LLMAO Integration Example
import { LLMAO } from 'llmao-sdk'

const client = new LLMAO({
  apiKey: process.env.LLMAO_API_KEY,
  endpoint: 'https://api.llmao.dev'
})

// Query your documentation
const response = await client.query({
  question: 'How do I implement authentication?',
  context: 'internal-docs',
  filters: ['api-reference', 'security']
})

console.log(response.answer)
console.log(response.sources)`}</code>
                        </pre>
                      </div>

                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
                          <Zap className="w-5 h-5 mr-2" />
                          Pro Tip
                        </h4>
                        <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                          Use the chat interface to ask specific questions about this documentation section. LLMAO can
                          provide contextual answers based on the content you're currently viewing.
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <h5 className="font-medium text-green-900 dark:text-green-100 mb-2">✅ Best Practice</h5>
                          <p className="text-green-800 dark:text-green-200 text-sm">
                            Always validate API responses and implement proper error handling.
                          </p>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                          <h5 className="font-medium text-amber-900 dark:text-amber-100 mb-2">⚠️ Important</h5>
                          <p className="text-amber-800 dark:text-amber-200 text-sm">
                            Keep your API keys secure and never expose them in client-side code.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div className="max-w-md">
                    <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold mb-3">Select a Section</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Choose a documentation section from the sidebar to view its content and start exploring.
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
