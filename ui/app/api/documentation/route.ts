import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { repoUrl, isPublic } = await req.json()

    if (!repoUrl && !isPublic) {
      return NextResponse.json({ error: "Repository URL is required for internal documentation" }, { status: 400 })
    }

    // For internal documentation, fetch from backend
    if (!isPublic) {
      try {
        const response = await fetch("http://127.0.0.1:5001/documentation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            repoUrl: repoUrl,
          }),
        })

        if (!response.ok) {
          throw new Error(`Backend error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json(data)
      } catch (error) {
        console.error("Error fetching from backend:", error)
        return NextResponse.json(
          { error: "Failed to fetch documentation from backend" },
          { status: 500 }
        )
      }
    }

    // For public documentation, return a default structure
    return NextResponse.json({
      documentation: {
        title: "Public Documentation",
        content: "This is the public documentation section. Content will be populated based on your public documentation sources.",
        sections: [
          {
            id: "overview",
            title: "Overview",
            content: "Welcome to the public documentation. This section provides general information about the system and its features."
          },
          {
            id: "getting-started",
            title: "Getting Started",
            content: "Learn how to get started with the system. This guide will walk you through the basic setup and configuration."
          },
          {
            id: "api-reference",
            title: "API Reference",
            content: "Complete API reference documentation with examples and usage patterns."
          }
        ]
      }
    })

  } catch (error) {
    console.error("Error in documentation API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 