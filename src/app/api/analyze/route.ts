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

KEY TAKEAWAYS
[3-4 most important things to remember about this plan, written as short, clear statements]

PLAN OVERVIEW
Monthly Premium: $X
Annual Deductible: $X
Plan Type: [HMO/PPO/etc.]
Network: [Insurance company name or network]
Out-of-Pocket Maximum: $X

DOCUMENT TYPE
[Brief explanation of what type of insurance document this is]

COVERAGE INCLUDED
Primary Care: [Details about doctor visits]
Specialist Care: [Details about specialist visits]
Hospital Care: [Details about inpatient/outpatient care]
Prescription Drugs: [Details about medication coverage]
Emergency Care: [Details about ER visits]
Preventive Care: [Details about wellness visits, screenings]

COST BREAKDOWN
Monthly Premium: $X (what you pay every month)
Deductible: $X (amount you pay first each year before insurance helps)
Primary Care Copay: $X per visit
Specialist Copay: $X per visit
Emergency Room: $X per visit
Prescription Copays: $X for generic, $X for brand name

NETWORK INFORMATION
In-Network: [Which doctors and hospitals you can use for lower costs]
Out-of-Network: [What happens and costs if you go outside the network]

PLAN STRENGTHS
[What's good about this plan - 3-4 key advantages]

PLAN LIMITATIONS
[What to watch out for - 3-4 key limitations or exclusions]

IMPORTANT DATES
[Key dates, enrollment periods, when coverage starts/ends]

Format everything cleanly with clear section headers. Present information in short, digestible chunks rather than long paragraphs. Do NOT use asterisks, bullets, or markdown symbols.
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