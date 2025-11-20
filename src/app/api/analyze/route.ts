import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { getDownloadURL, ref } from 'firebase/storage'
import { storage } from '@/lib/firebase'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { fileUrl, fileName, userId } = await request.json()

    if (!fileUrl || !fileName || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: fileUrl, fileName, userId' },
        { status: 400 }
      )
    }

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
You are helping someone who doesn't understand insurance at all. Analyze this insurance document and explain it in plain, simple English with NO industry jargon.

Please provide:

## What This Document Is
- Explain what type of insurance document this is in simple terms

## What You're Covered For
- List the main things this insurance will pay for
- Use everyday language (avoid terms like "benefits", "coverage", etc.)

## What You Pay
- How much do you pay each month? (premium)
- How much do you pay when you use healthcare? (deductible, copays)
- Explain these in simple terms like "You pay $X first, then insurance kicks in"

## What's Good About This Plan
- What are the positive aspects or advantages?
- What makes this plan helpful or valuable?

## What to Watch Out For
- What are the limitations or downsides?
- What might surprise you or cost extra money?
- What's NOT covered that people might expect?

## Important Things to Remember
- Key dates, deadlines, or requirements
- Most important things to know in 3-4 simple bullet points

Use simple language like you're explaining to a friend who has never had insurance before. Avoid words like: deductible, copay, coinsurance, premium, benefits, coverage, exclusions - instead use plain English explanations.
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
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid or missing API key' },
          { status: 401 }
        )
      }
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'API quota exceeded. Please try again later.' },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to analyze document. Please try again.' },
      { status: 500 }
    )
  }
}