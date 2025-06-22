// Completely disable NextAuth to prevent errors
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    {
      error: "Authentication disabled",
      message: "Authentication is currently disabled for this demo",
    },
    { status: 501 },
  )
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Authentication disabled",
      message: "Authentication is currently disabled for this demo",
    },
    { status: 501 },
  )
}
