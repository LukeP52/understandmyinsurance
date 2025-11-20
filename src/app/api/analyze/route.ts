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
Analyze this insurance document and provide a clear explanation in plain English.

Please provide your response in this EXACT format:

KEY TAKEAWAYS
• [Most important thing about this plan]
• [Second most important thing]  
• [Third most important thing]
• [Fourth most important thing if relevant]

PLAN OVERVIEW
Monthly Premium: $X
Annual Deductible: $X  
Plan Type: [HMO/PPO/etc.]
Network: [Insurance company name]
Out-of-Pocket Maximum: $X
Coverage Start Date: [Date]
Primary Care Copay: $X
Specialist Copay: $X

DOCUMENT TYPE
[Brief explanation of what type of insurance document this is]

WHAT YOU'RE COVERED FOR
• Primary care doctor visits
• Specialist visits
• Hospital stays (inpatient and outpatient)
• Emergency room visits
• Prescription medications
• Preventive care (checkups, screenings)
• [Other specific services covered]

WHAT YOU PAY
• Monthly Premium: $X (what you pay every month whether you use healthcare or not)
• Deductible: $X (amount you must pay out-of-pocket before insurance starts helping)
• Copays: Fixed amounts you pay for each service (e.g., $25 per doctor visit)
• Coinsurance: Percentage you pay after meeting deductible (e.g., you pay 20%, insurance pays 80%)

NETWORK DETAILS
• In-Network: [Which doctors and hospitals you can use for lower costs]
• Out-of-Network: [What happens if you go outside the network - higher costs or not covered]

WHAT'S GOOD ABOUT THIS PLAN
• [Positive aspect 1]
• [Positive aspect 2] 
• [Positive aspect 3]
• [Additional benefits or advantages]

WHAT TO WATCH OUT FOR
• [Limitation or exclusion 1]
• [Limitation or exclusion 2]
• [Things that might cost extra]
• [Services not covered]

IMPORTANT DATES AND DEADLINES
• [Coverage start/end dates]
• [Enrollment periods]
• [Any important deadlines]

Format with clear headers and bullet points. Explain insurance terms simply.
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