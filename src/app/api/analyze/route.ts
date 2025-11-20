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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

    // Create the prompt for insurance document analysis
    const prompt = `
Analyze this insurance document and provide a comprehensive summary. Focus on:

1. **Document Type**: What type of insurance document is this? (policy, benefits summary, EOB, etc.)
2. **Coverage Summary**: What is covered and what are the key benefits?
3. **Key Details**: 
   - Deductibles
   - Copays/Coinsurance
   - Coverage limits
   - Premium information (if available)
   - Policy period/dates
4. **Important Exclusions**: What's NOT covered?
5. **Action Items**: Any important dates, requirements, or actions needed?
6. **Key Takeaways**: 3-5 bullet points of the most important information

Please format your response in clear sections with headers. Be specific about dollar amounts, percentages, and dates when available.
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