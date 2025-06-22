"use client"

import { useChat } from "ai/react"
import { SplitScreenChat } from "@/components/split-screen-chat"

export default function PublicChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/public-chat",
    initialMessages: [
      {
        id: "system-1",
        role: "system",
        content:
          "You are LLMAO (Large Language Model Aided Overflow), an AI assistant for public documentation. Provide helpful, accurate responses based on available documentation.",
      },
    ],
    // Ensure messages persist properly
    keepLastMessageOnError: true,
  })

  return (
    <SplitScreenChat
      messages={messages}
      input={input}
      handleInputChange={handleInputChange}
      handleSubmit={handleSubmit}
      isLoading={isLoading}
      title="Public Documentation Chat"
      backUrl="/"
      isPublic={true}
    />
  )
}
