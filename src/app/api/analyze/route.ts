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
Analyze this insurance document and provide a clear, well-formatted explanation. Use proper formatting with clear sections and NO asterisks (*) or bullet points in the main text.

Please provide your response in this EXACT format:

QUICK OVERVIEW
Monthly Cost: $X (the premium you pay each month)
Deductible: $X (amount you pay first each year before insurance kicks in)
Network: [In-Network/Out-of-Network details]
Plan Type: [HMO/PPO/etc. with brief explanation]

DOCUMENT TYPE
[Explain what type of insurance document this is]

WHAT YOU'RE COVERED FOR
[List main services covered - doctor visits, hospital stays, prescriptions, etc.]

WHAT YOU PAY
Monthly Premium: $X
Deductible: $X (explain what this means)
Copays: $X for [service] (fixed amount you pay for each visit)
Coinsurance: X% (percentage you pay after meeting deductible)

NETWORK DETAILS
In-Network: [Which doctors/hospitals are included]
Out-of-Network: [What happens if you go outside the network]

WHAT'S GOOD ABOUT THIS PLAN
[Positive aspects and advantages]

WHAT TO WATCH OUT FOR
[Limitations, exclusions, things that might surprise you]

IMPORTANT DATES AND DEADLINES
[Key dates, enrollment periods, etc.]

KEY TAKEAWAYS
[3-4 most important things to remember]

Format everything cleanly with proper headings. Do NOT use asterisks, bullets, or markdown symbols. Use clear section headers and readable paragraphs.
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