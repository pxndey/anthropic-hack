import { NextResponse } from "next/server"
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js"

// Initialize ElevenLabs client
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
})

export async function GET() {
  try {
    // Create a single-use token for realtime scribe
    const token = await elevenlabs.tokens.singleUse.create("realtime_scribe")
    
    return NextResponse.json(token)
  } catch (error) {
    console.error("Failed to create scribe token:", error)
    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 }
    )
  }
}