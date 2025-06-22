"use client"

import { useChat } from "ai/react"
import { SplitScreenChat } from "@/components/split-screen-chat"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Lock, Brain, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Config {
  repo: string
  timestamp: number
}

export default function InternalChatPage() {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [config, setConfig] = useState<Config | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleBackToSetup = useCallback(() => {
    // Clear current config but keep auth
    sessionStorage.removeItem("llmao_config")
    router.replace("/internal")
  }, [router])

  const handleBackToHome = useCallback(() => {
    // Clear everything and go home
    sessionStorage.removeItem("isInternalAuthorized")
    sessionStorage.removeItem("authTimestamp")
    sessionStorage.removeItem("llmao_config")
    router.push("/")
  }, [router])

  useEffect(() => {
    const checkAuth = () => {
      try {
        const authorized = sessionStorage.getItem("isInternalAuthorized") === "true"
        const authTimestamp = sessionStorage.getItem("authTimestamp")
        const configData = sessionStorage.getItem("llmao_config")

        // Check auth expiration
        if (authorized && authTimestamp) {
          const authAge = Date.now() - Number.parseInt(authTimestamp)
          const maxAuthAge = 24 * 60 * 60 * 1000 // 24 hours

          if (authAge > maxAuthAge) {
            console.log("Authentication expired")
            sessionStorage.removeItem("isInternalAuthorized")
            sessionStorage.removeItem("authTimestamp")
            sessionStorage.removeItem("llmao_config")
            router.push("/internal")
            return
          }
        }

        if (!authorized) {
          console.log("Not authorized, redirecting to login")
          router.push("/internal")
          return
        }

        if (!configData) {
          console.log("No configuration found, redirecting to setup")
          router.push("/internal")
          return
        }

        const parsedConfig = JSON.parse(configData) as Config

        // Check config expiration
        const configAge = Date.now() - parsedConfig.timestamp
        const maxConfigAge = 24 * 60 * 60 * 1000 // 24 hours

        if (configAge > maxConfigAge) {
          console.log("Configuration expired, redirecting to setup")
          sessionStorage.removeItem("llmao_config")
          router.push("/internal")
          return
        }

        setConfig(parsedConfig)
        setIsAuthorized(true)
      } catch (error) {
        console.error("Failed to parse config:", error)
        setError("Configuration error. Please reconfigure your settings.")
        // Don't auto-redirect on parse error, let user choose
      } finally {
        setIsLoading(false)
      }
    }

    // Check auth immediately
    checkAuth()
  }, [router])

  const systemMessage = config
    ? `You are LLMAO (Large Language Model Aided Overflow), an AI assistant for ${config.repo}. You have access to all internal documentation and code from this repository. Provide helpful, accurate responses based on this documentation.`
    : "You are LLMAO (Large Language Model Aided Overflow), an AI assistant for internal documentation."

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: chatLoading,
  } = useChat({
    api: "/api/internal-chat",
    initialMessages: [
      {
        id: "system-1",
        role: "system",
        content: systemMessage,
      },
    ],
    body: {
      repo: config?.repo || "",
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Configuration Error</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">{error}</p>
          <div className="space-y-3">
            <Button
              onClick={handleBackToSetup}
              className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
            >
              Reconfigure Settings
            </Button>
            <Button onClick={handleBackToHome} variant="outline" className="w-full">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show unauthorized screen if not properly authenticated
  if (!isAuthorized || !config) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            You need to authenticate and configure your documentation source to access the internal chat.
          </p>
          <div className="space-y-3">
            <Button
              onClick={handleBackToSetup}
              className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
            >
              Go to Setup
            </Button>
            <Button onClick={handleBackToHome} variant="outline" className="w-full">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SplitScreenChat
      messages={messages}
      input={input}
      handleInputChange={handleInputChange}
      handleSubmit={handleSubmit}
      isLoading={chatLoading}
      title="Internal Documentation Chat"
      backUrl="/internal"
      repoUrl={config.repo}
      isPublic={false}
    />
  )
}
