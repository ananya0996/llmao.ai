import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Shield, Globe, Sparkles, Zap, Brain, Code, Cloud, ExternalLink } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center animate-pulse">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  llmao.ai
                </span>
                <p className="text-xs text-muted-foreground -mt-1">Large Language Model Aided Overview</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>Powered by AI</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
              Revolutionary Documentation Experience
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 dark:from-gray-100 dark:via-purple-300 dark:to-blue-300 bg-clip-text text-transparent leading-tight">
            llmao.ai
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-foreground">
            LLM Aided Overview
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
            Experience documentation like never before. Split-screen interface with live documentation and intelligent
            AI chat. Get instant answers while browsing through your codebase and internal docs.
          </p>
          
          {/* Compact Powered By Section */}
          <div className="flex items-center justify-center space-x-6 mb-12">
            <span className="text-sm text-muted-foreground font-medium">Powered by</span>
            <div className="flex items-center space-x-4">
              {/* Letta Cloud */}
              <div className="group flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-900/80 transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-md flex items-center justify-center">
                  <Cloud className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Letta Cloud</span>
              </div>
              
              {/* V0 Vercel */}
              <div className="group flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-900/80 transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50">
                <div className="w-6 h-6 bg-gradient-to-r from-black to-gray-800 rounded-md flex items-center justify-center">
                  <Code className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">v0 by Vercel</span>
              </div>
              
              {/* Google Gemini */}
              <div className="group flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-900/80 transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
                  <Brain className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Google Gemini</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          <Card className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-8 relative">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Internal Access</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Secure & Private</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Secure access to private repositories and internal documentation. Split-screen interface with
                live documentation browsing and intelligent AI assistance for your development team.
              </p>
              <Link href="/internal" className="block">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 rounded-xl transition-all duration-300 group-hover:shadow-xl">
                  Access Internal Docs
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-8 relative">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Public Documentation</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Open & Accessible</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Open access to public documentation and resources. Interactive documentation viewer with AI-powered chat
                assistance. Perfect for exploring APIs, guides, and community resources.
              </p>
              <Link href="/chat" className="block">
                <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-4 rounded-xl transition-all duration-300 group-hover:shadow-xl">
                  Explore Public Docs
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Features Showcase */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          {[
            { icon: Code, title: "Split-Screen Interface", desc: "Documentation and AI chat side by side" },
            { icon: Zap, title: "Real-time Responses", desc: "Instant AI-powered answers with typing indicators" },
            { icon: Brain, title: "Smart Search", desc: "Advanced search through chat history and docs" },
          ].map((feature, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-slate-900/70 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{feature.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Status Indicators */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-8 text-sm text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-full px-8 py-4 shadow-lg">
            <span className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Real-time AI responses
            </span>
            <span className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
              Secure authentication
            </span>
            <span className="flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
              Smart document search
            </span>
            <span className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
              Resizable interface
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
