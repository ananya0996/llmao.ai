// Allow streaming responses up to 30 seconds
export const maxDuration = 30

function textToStream(text: string, chunkDelay = 30) {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      const words = text.split(" ")
      let i = 0
      const push = () => {
        if (i < words.length) {
          controller.enqueue(encoder.encode(`0:"${words[i]}${i < words.length - 1 ? " " : ""}"\n`))
          i++
          setTimeout(push, chunkDelay)
        } else {
          controller.enqueue(encoder.encode("d:\n"))
          controller.close()
        }
      }
      push()
    },
  })
}

export async function POST(req: Request) {
  try {
    const { messages, repo, conf } = await req.json()

    const latestUserMsg =
      [...messages]
        .reverse()
        .find((m: any) => m.role === "user")
        ?.content?.trim() ?? ""

    if (!latestUserMsg) {
      return new Response("No content", { status: 400 })
    }

    // Use your actual API URL here instead of environment variables
    // Replace this with your real API endpoint
    const apiURL = "https://your-actual-api-endpoint.com/chat"
    const apiKey = "your-actual-api-key" // or leave empty if not needed

    // For demo purposes, let's simulate a response instead of calling external API
    const simulatedResponse = `Based on your internal documentation for ${repo} and Confluence at ${conf}, here's what I found regarding: "${latestUserMsg}". This is a simulated response that demonstrates how your custom API integration would work. You can replace this logic with your actual API call.`

    // Uncomment and modify this section when you have your real API ready:
    /*
    const upstream = await fetch(apiURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: latestUserMsg,
        context: "internal-documentation",
        repository: repo,
        confluence: conf,
      }),
    })

    if (!upstream.ok) {
      throw new Error(`API error ${upstream.status}`)
    }

    const contentType = upstream.headers.get("content-type") || ""
    let answer = ""

    if (contentType.includes("application/json")) {
      const data = await upstream.json()
      answer = data.answer ?? data.response ?? data.text ?? "No response"
    } else {
      answer = await upstream.text()
    }
    */

    // For now, use the simulated response
    const answer = simulatedResponse

    return new Response(textToStream(answer), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
      },
    })
  } catch (err) {
    console.error("Error in internal chat:", err)
    return new Response(
      textToStream(
        "I'm sorry, I had trouble processing your request. This is a demo response while your custom API is being configured.",
      ),
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Vercel-AI-Data-Stream": "v1",
        },
        status: 500,
      },
    )
  }
}
