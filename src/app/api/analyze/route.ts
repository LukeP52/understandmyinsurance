import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // requests per minute
const RATE_WINDOW = 60 * 1000 // 1 minute in ms

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_WINDOW })
    return false
  }

  if (userLimit.count >= RATE_LIMIT) {
    return true
  }

  userLimit.count++
  return false
}

// Validate URL is from Firebase Storage
function isValidStorageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.hostname === 'firebasestorage.googleapis.com'
  } catch {
    return false
  }
}

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

    const body = await request.json()
    const { fileUrl, fileName, userId, files, mode = 'single' } = body

    // Check rate limit
    if (!userId || isRateLimited(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a minute before trying again.' },
        { status: 429 }
      )
    }

    if (mode === 'single') {
      if (!fileUrl || !fileName || !userId) {
        return NextResponse.json(
          { error: 'Missing required fields: fileUrl, fileName, userId' },
          { status: 400 }
        )
      }
      // Validate URL is from Firebase Storage (SSRF protection)
      if (!isValidStorageUrl(fileUrl)) {
        return NextResponse.json(
          { error: 'Invalid file URL' },
          { status: 400 }
        )
      }
      console.log('Starting single analysis for file:', fileName)
    } else {
      if (!files || !userId || !Array.isArray(files)) {
        return NextResponse.json(
          { error: 'Missing required fields for comparison: files, userId' },
          { status: 400 }
        )
      }
      // Validate all URLs are from Firebase Storage (SSRF protection)
      for (const file of files) {
        if (!isValidStorageUrl(file.url)) {
          return NextResponse.json(
            { error: 'Invalid file URL' },
            { status: 400 }
          )
        }
      }
      console.log('Starting comparison analysis for', files.length, 'files')
    }

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    let analysisText

    if (mode === 'single') {
      // Single file analysis
      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch file from storage')
      }

      const arrayBuffer = await response.arrayBuffer()
      const base64Data = Buffer.from(arrayBuffer).toString('base64')

      const singlePrompt = `
CRITICAL RULE - READ THIS FIRST: Only report information EXPLICITLY stated in the document. If ANY value is not provided, you MUST write "Not listed in document" for that field. NEVER estimate, guess, or infer any costs, premiums, copays, or plan details. When in doubt, write "Not listed in document".

Analyze this insurance document and provide a clear explanation in plain English.

Please provide your response in this EXACT format with ONLY these 4 sections:

WHAT'S GOOD ABOUT THIS PLAN
• This plan would be good for you if [describe ideal user situation - max 40 words]
• [Coverage benefits - max 40 words]
• [Cost advantages - max 40 words]
• [Network or convenience benefits - max 40 words]

WHAT TO WATCH OUT FOR
• Avoid getting this plan if [describe who should not choose this plan - max 40 words]
• [High costs or deductible concerns - max 40 words]
• [Coverage limitations or exclusions - max 40 words]
• [Network restrictions or access issues - max 40 words]

PLAN OVERVIEW
Monthly Premium: [exact value from document, or "Not listed in document"]
Annual Deductible: [exact value from document, or "Not listed in document"]
Out-of-Pocket Maximum: [exact value from document, or "Not listed in document"]
Plan Type: [exact value from document, or "Not listed in document"]
Network: [exact value from document, or "Not listed in document"]
Primary Care Copay: [exact value from document, or "Not listed in document"]
Specialist Copay: [exact value from document, or "Not listed in document"]
Emergency Room Cost: [exact value from document, or "Not listed in document"]
Urgent Care Cost: [exact value from document, or "Not listed in document"]
Prescription Drug Coverage: [exact value from document, or "Not listed in document"]
Pediatric Dental & Vision: [exact value from document, or "Not listed in document"]
Adult Dental & Vision: [exact value from document, or "Not listed in document"]

REAL-WORLD SCENARIO: HOW THIS PLAN WORKS
Create a realistic patient journey showing how costs accumulate, using ONLY values from this document.

Structure your scenario like this:
• Start with a patient who has met some of their deductible (use the document's actual deductible amount)
• Show a primary care visit (use the document's actual copay)
• Show a procedure/test that applies to the deductible (use actual coinsurance if listed)
• Show a specialist visit (use actual specialist copay)
• Show a prescription (use actual drug tier costs)
• End with a SUMMARY totaling what the patient paid

IMPORTANT: Only include steps where you have real numbers from the document. Skip any step where the cost isn't specified - don't write "not listed" in the middle of the scenario. If most costs are missing, write a shorter scenario using only what's available. NEVER invent or estimate dollar amounts.

IMPORTANT: Keep ALL sentences to 40 words or less. Use simple language and define insurance terms in parentheses. NEVER use asterisks (*) anywhere in your response. Use bullet points (•) for all sections. Each bullet point must cover a DIFFERENT topic - no repetition.
`

      const result = await model.generateContent([
        singlePrompt,
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Data
          }
        }
      ])

      analysisText = result.response.text()

    } else {
      // Multiple file comparison
      const fileData = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const response = await fetch(file.url)
        if (!response.ok) {
          throw new Error(`Failed to fetch file from storage: ${file.name}`)
        }
        
        const arrayBuffer = await response.arrayBuffer()
        const base64Data = Buffer.from(arrayBuffer).toString('base64')
        
        fileData.push({
          name: file.name,
          data: base64Data
        })
      }

      const comparePrompt = `
CRITICAL RULE - READ THIS FIRST: Only report information EXPLICITLY stated in the documents. If ANY value is not provided, you MUST write "Not listed" for that field. NEVER estimate, guess, or infer any costs, premiums, copays, or plan details. When in doubt, write "Not listed".

Compare these ${fileData.length} insurance plans and provide your response in this EXACT format with these 3 sections:

THE BOTTOM LINE
Write a friendly, conversational summary explaining who should choose each plan. Use full sentences, not bullet points. Write 1 paragraph per plan explaining who it's best for and why. Only mention specific dollar amounts that are EXPLICITLY stated in the documents. If a cost isn't listed, don't mention it.

SIDE-BY-SIDE NUMBERS
Create a comparison table with one row per line. Use this EXACT format with | as separator:

Category | Plan A | Plan B
Monthly Premium | [value or "Not listed"] | [value or "Not listed"]
Annual Deductible | [value or "Not listed"] | [value or "Not listed"]
Out-of-Pocket Maximum | [value or "Not listed"] | [value or "Not listed"]
Coinsurance | [value or "Not listed"] | [value or "Not listed"]
Plan Type | [value or "Not listed"] | [value or "Not listed"]
Network | [value or "Not listed"] | [value or "Not listed"]
Primary Care | [value or "Not listed"] | [value or "Not listed"]
Specialist | [value or "Not listed"] | [value or "Not listed"]
Emergency Room | [value or "Not listed"] | [value or "Not listed"]
Urgent Care | [value or "Not listed"] | [value or "Not listed"]
Prescription Drugs | [value or "Not listed"] | [value or "Not listed"]
Pediatric Dental & Vision | [value or "Not listed"] | [value or "Not listed"]
Adult Dental & Vision | [value or "Not listed"] | [value or "Not listed"]

Include all 13 categories above. For costs, include copays ($X), coinsurance (X%), or both (e.g., "$300 + 20%") - whatever the plan specifies. Use "Not listed" if a value isn't in the document. DO NOT estimate or guess any values.

PLAN DETAILS
For each plan, provide a card with key info:

${fileData.map((f, i) => `PLAN ${String.fromCharCode(65 + i)} (${f.name})
Best for: [One sentence describing the ideal person for this plan]

Key Numbers:
• Monthly Premium (what you pay every month): [exact value from document, or "Not listed"]
• Annual Deductible (what you pay before insurance kicks in): [exact value from document, or "Not listed"]
• Out-of-Pocket Max (the most you'd pay in a year): [exact value from document, or "Not listed"]
• Primary Care Visit: [exact value from document, or "Not listed"]
• Specialist Visit: [exact value from document, or "Not listed"]
• Emergency Room: [exact value from document, or "Not listed"]
• Urgent Care: [exact value from document, or "Not listed"]

CHOOSE THIS PLAN IF:
• [Specific life situation where this plan wins]
• [Another good reason to pick this plan]
• [Who benefits most from this plan's structure]

WATCH OUT FOR:
• [Main downside or limitation in plain language]
• [Situations where this plan costs more]
• [Important coverage gaps to know about]
`).join('\n')}

Write in a warm, helpful tone like you're explaining to a friend who doesn't know much about insurance. Use proper terms (like "deductible") but briefly explain what they mean in parentheses the first time. NEVER use asterisks (*) - use bullet points (•) only.
`

      // Send all files to Gemini for comparison
      const content: any[] = [comparePrompt]
      
      for (let i = 0; i < fileData.length; i++) {
        content.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: fileData[i].data
          }
        })
      }

      const result = await model.generateContent(content)
      analysisText = result.response.text()
    }

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