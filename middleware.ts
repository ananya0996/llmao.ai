import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Only apply middleware to internal chat routes
  if (request.nextUrl.pathname.startsWith("/internal/chat")) {
    // Allow navigation from internal pages
    const referer = request.headers.get("referer")
    const isFromInternal = referer && (referer.includes("/internal") || referer.includes("/internal/chat"))

    // Don't redirect if coming from internal pages or if it's a same-origin request
    if (isFromInternal || request.nextUrl.pathname === request.headers.get("referer")) {
      return NextResponse.next()
    }

    // Only redirect direct external access attempts
    const userAgent = request.headers.get("user-agent") || ""
    const isDirectAccess = !referer || (!referer.includes(request.nextUrl.origin) && !userAgent.includes("Next.js"))

    if (isDirectAccess) {
      return NextResponse.redirect(new URL("/internal", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/internal/chat/:path*"],
}
