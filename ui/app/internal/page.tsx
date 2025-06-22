"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect } from "react"
import {
  Lock,
  Github,
  FileText,
  ArrowRight,
  Eye,
  EyeOff,
  Brain,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

interface Config {
  repo: string
  conf: string
  timestamp: number
}

export default function InternalPage() {
  const [repoUrl, setRepoUrl] = useState("")
  const [confUrl, setConfUrl] = useState("")
  const [assistantMessage, setAssistantMessage] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [configError, setConfigError] = useState("")
  const [authLoading, setAuthLoading] = useState(true)
  const [repoUrlValid, setRepoUrlValid] = useState<boolean | null>(null)
  const [confUrlValid, setConfUrlValid] = useState<boolean | null>(null)
  const router = useRouter()

  // URL validation functions
  const validateGitHubUrl = useCallback((url: string): boolean => {
    if (!url.trim()) return false
    try {
      const urlObj = new URL(url)
      return urlObj.hostname === "github.com" && urlObj.pathname.split("/").length >= 3
    } catch {
      return false
    }
  }, [])

  const validateConfluenceUrl = useCallback((url: string): boolean => {
    if (!url.trim()) return false
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.includes("atlassian.net") || urlObj.pathname.includes("/wiki")
    } catch {
      return false
    }
  }, [])

  // Real-time URL validation
  useEffect(() => {
    if (repoUrl) {
      setRepoUrlValid(validateGitHubUrl(repoUrl))
    } else {
      setRepoUrlValid(null)
    }
  }, [repoUrl, validateGitHubUrl])

  useEffect(() => {
    if (confUrl) {
      setConfUrlValid(validateConfluenceUrl(confUrl))
    } else {
      setConfUrlValid(null)
    }
  }, [confUrl, validateConfluenceUrl])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      e.stopPropagation()

      setConfigError("")

      // Validate inputs
      if (!repoUrl.trim() || !confUrl.trim()) {
        setConfigError("Both GitHub repository and Confluence URLs are required")
        return
      }

      if (!validateGitHubUrl(repoUrl)) {
        setConfigError("Please enter a valid GitHub repository URL (e.g., https://github.com/username/repository)")
        return
      }

      if (!validateConfluenceUrl(confUrl)) {
        setConfigError("Please enter a valid Confluence URL (e.g., https://your-domain.atlassian.net/wiki)")
        return
      }

      setIsLoading(true)

      try {
        // Send repository data to Python server
        console.log("Where are you");
        const response = await fetch("http://127.0.0.1:5000/repo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            repoUrl: repoUrl.trim(),
            confUrl: confUrl.trim(),
          }),
        })
        console.log("Works");

        const result = await response.json()

        /*if (!response.ok) {
          throw new Error(result.details || result.error || "Failed to send repository to Python server")
        }*/

        if (result && result.assistantMessageContent) {
          console.log("Received assistant message:", result.assistantMessageContent);
    
          // Display or use it in your UI
          setAssistantMessage(result.assistantMessageContent);
        } else {
          console.error("Assistant message missing in response", result);
        }
        } catch (error) {
          console.error("Request failed:", error);
        

        console.log("Successfully sent to Python server:", result)

        const config: Config = {
          repo: repoUrl.trim(),
          conf: confUrl.trim(),
          timestamp: Date.now(),
        }

        // Clear any existing config first
        sessionStorage.removeItem("llmao_config")

        // Set new config
        sessionStorage.setItem("llmao_config", JSON.stringify(config))

        // Verify it was saved
        const saved = sessionStorage.getItem("llmao_config")
        if (!saved) {
          throw new Error("Failed to save configuration")
        }

        // Navigate after a short delay to ensure state is saved
        setTimeout(() => {
          router.push("/internal/chat")
        }, 500)
      } catch (error) {
        console.error("Error during submission:", error)
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
        setConfigError(`Error: ${errorMessage}`)
        setIsLoading(false)
      }
    },
    [repoUrl, confUrl, validateGitHubUrl, validateConfluenceUrl, router],
  )

  const handleLogin = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      e.stopPropagation()

      setError("")
      setIsLoading(true)

      setTimeout(() => {
        const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123"

        if (password === adminPassword) {
          try {
            sessionStorage.setItem("isInternalAuthorized", "true")
            sessionStorage.setItem("authTimestamp", Date.now().toString())
            setIsAuthorized(true)
            setError("")
          } catch (error) {
            console.error("Failed to set authorization:", error)
            setError("Authorization failed. Please try again.")
          }
        } else {
          setError("Invalid password")
        }
        setIsLoading(false)
      }, 800)
    },
    [password],
  )

  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const authorized = sessionStorage.getItem("isInternalAuthorized") === "true"
        const authTimestamp = sessionStorage.getItem("authTimestamp")
        const configData = sessionStorage.getItem("llmao_config")

        // Check if auth is expired (24 hours)
        if (authorized && authTimestamp) {
          const authAge = Date.now() - Number.parseInt(authTimestamp)
          const maxAuthAge = 24 * 60 * 60 * 1000 // 24 hours

          if (authAge > maxAuthAge) {
            // Auth expired
            sessionStorage.removeItem("isInternalAuthorized")
            sessionStorage.removeItem("authTimestamp")
            sessionStorage.removeItem("llmao_config")
            setIsAuthorized(false)
            setAuthLoading(false)
            return
          }
        }

        // If authorized and has valid config, redirect to chat
        if (authorized && configData) {
          try {
            const config = JSON.parse(configData) as Config
            const configAge = Date.now() - config.timestamp
            const maxConfigAge = 24 * 60 * 60 * 1000 // 24 hours

            if (configAge <= maxConfigAge) {
              // Valid session exists, redirect to chat
              router.push("/internal/chat")
              return
            } else {
              // Config expired, clear it but keep auth
              sessionStorage.removeItem("llmao_config")
            }
          } catch {
            // Invalid config, clear it
            sessionStorage.removeItem("llmao_config")
          }
        }

        setIsAuthorized(authorized)
      } catch (error) {
        console.error("Error checking auth status:", error)
        // Clear everything on error
        sessionStorage.removeItem("isInternalAuthorized")
        sessionStorage.removeItem("authTimestamp")
        sessionStorage.removeItem("llmao_config")
        setIsAuthorized(false)
      } finally {
        setAuthLoading(false)
      }
    }

    // Check auth status after a brief delay
    const timer = setTimeout(checkAuthStatus, 100)
    return () => clearTimeout(timer)
  }, [router])

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center p-4">
        {/* Back Button */}
        <div className="absolute top-6 left-6 right-6 flex justify-between z-10">
          <Link href="/" replace>
            <Button variant="outline" className="bg-background/80 backdrop-blur-sm hover:bg-background">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              LLMAO Internal
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Enter your admin credentials to continue</p>
          </div>

          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Admin Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-12 h-14 border-2 focus:border-purple-500 rounded-xl text-lg"
                      placeholder="Enter admin password"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {error && (
                    <p className="text-sm text-red-500 flex items-center animate-shake">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {error}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full h-14 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 text-lg"
                  disabled={isLoading || !password.trim()}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      Authenticating...
                    </div>
                  ) : (
                    <>
                      <Brain className="mr-2 w-5 h-5" />
                      Access LLMAO
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center p-4">
      {/* Back Button */}
      <div className="absolute top-6 left-6 right-6 flex justify-between z-10">
        <Link href="/" replace>
          <Button variant="outline" className="bg-background/80 backdrop-blur-sm hover:bg-background">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-2xl animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Configure Documentation Sources
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Connect your GitHub repository and Confluence workspace</p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardContent className="p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <label
                  htmlFor="repo"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center"
                >
                  <Github className="w-5 h-5 mr-2" />
                  GitHub Repository URL
                </label>
                <div className="relative">
                  <Input
                    id="repo"
                    type="url"
                    placeholder="https://github.com/username/repository"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className={`h-14 border-2 rounded-xl text-lg pr-10 ${
                      repoUrlValid === false
                        ? "border-red-500 focus:border-red-500"
                        : repoUrlValid === true
                          ? "border-green-500 focus:border-green-500"
                          : "focus:border-purple-500"
                    }`}
                    required
                    disabled={isLoading}
                  />
                  {repoUrlValid !== null && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {repoUrlValid ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label
                  htmlFor="conf"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Confluence Base URL
                </label>
                <div className="relative">
                  <Input
                    id="conf"
                    type="url"
                    placeholder="https://your-domain.atlassian.net/wiki"
                    value={confUrl}
                    onChange={(e) => setConfUrl(e.target.value)}
                    className={`h-14 border-2 rounded-xl text-lg pr-10 ${
                      confUrlValid === false
                        ? "border-red-500 focus:border-red-500"
                        : confUrlValid === true
                          ? "border-green-500 focus:border-green-500"
                          : "focus:border-purple-500"
                    }`}
                    required
                    disabled={isLoading}
                  />
                  {confUrlValid !== null && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {confUrlValid ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {configError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    {configError}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-16 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 text-lg shadow-lg"
                disabled={
                  isLoading || !repoUrl.trim() || !confUrl.trim() || repoUrlValid === false || confUrlValid === false
                }
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    <div className="flex flex-col">
                      <span>Connecting to LLMAO...</span>
                      <span className="text-xs opacity-80">Initializing documentation interface</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <Brain className="mr-3 w-6 h-6" />
                    Launch LLMAO Interface
                    <ArrowRight className="ml-3 w-6 h-6" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
