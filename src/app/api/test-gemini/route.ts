import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function GET() {
  try {
    // Test if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'GEMINI_API_KEY not configured in environment variables' 
        },
        { status: 500 }
      )
    }

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    // Simple test prompt
    const prompt = "Say 'Hello from Gemini AI!' and explain in one sentence what you can do for insurance document analysis."

    // Test the connection
    const result = await model.generateContent(prompt)
    const response = result.response.text()

    return NextResponse.json({
      success: true,
      message: 'Gemini API is working correctly!',
      response: response,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Gemini test error:', error)
    
    // Handle specific API errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid API key. Please check your GEMINI_API_KEY environment variable.' 
          },
          { status: 401 }
        )
      }
      if (error.message.includes('quota') || error.message.includes('limit')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'API quota exceeded. Please check your Gemini API usage limits.' 
          },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect to Gemini API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}