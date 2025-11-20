import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { getDownloadURL, ref } from 'firebase/storage'
import { storage } from '@/lib/firebase'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables')
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please contact support.' },
        { status: 500 }
      )
    }

    const { fileUrl, fileName, userId } = await request.json()

    if (!fileUrl || !fileName || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: fileUrl, fileName, userId' },
        { status: 400 }
      )
    }

    console.log('Starting analysis for file:', fileName)

    // Fetch the file from Firebase Storage
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch file from storage')
    }

    const arrayBuffer = await response.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString('base64')

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // Create the prompt for insurance document analysis  
    const prompt = `
Analyze this insurance document and explain it clearly.

Provide your response in this format:

KEY TAKEAWAYS
List 3-4 most important things about this plan

PLAN OVERVIEW  
Monthly Premium: $X
Annual Deductible: $X
Plan Type: HMO/PPO/etc
Network: Name of network

COVERAGE
What's covered for doctor visits, specialists, hospital, prescriptions

COSTS
What you pay monthly and when you use healthcare

NETWORK
Which doctors you can use

STRENGTHS
What's good about this plan

LIMITATIONS  
What to watch out for

Keep sections short and clear. No asterisks or bullets.
`

    // Analyze the document
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Data
        }
      }
    ])

    const analysisText = result.response.text()

    return NextResponse.json({
      success: true,
      analysis: analysisText,
      fileName: fileName,
      analyzedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Analysis error:', error)
    
    // Handle specific API errors
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      
      if (error.message.includes('API_KEY') || error.message.includes('API key') || error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Invalid Gemini API key. Please check configuration.' },
          { status: 401 }
        )
      }
      if (error.message.includes('quota') || error.message.includes('429')) {
        return NextResponse.json(
          { error: 'API quota exceeded. Please try again later.' },
          { status: 429 }
        )
      }
      if (error.message.includes('404') || error.message.includes('model')) {
        return NextResponse.json(
          { error: 'Gemini model not available. Please try again later.' },
          { status: 503 }
        )
      }
      
      // Return specific error message for debugging
      return NextResponse.json(
        { 
          error: 'Analysis failed',
          details: error.message,
          type: error.constructor.name
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to analyze document. Please try again.' },
      { status: 500 }
    )
  }
}