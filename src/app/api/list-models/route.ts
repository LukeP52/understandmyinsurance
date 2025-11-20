import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function GET() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      )
    }

    // List available models
    const models = await genAI.listModels()
    
    return NextResponse.json({
      success: true,
      models: models.map(model => ({
        name: model.name,
        displayName: model.displayName,
        description: model.description,
        supportedGenerationMethods: model.supportedGenerationMethods
      }))
    })

  } catch (error) {
    console.error('Error listing models:', error)
    return NextResponse.json(
      { 
        error: 'Failed to list models',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}