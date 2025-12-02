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
Monthly Premium: $X
Annual Deductible: $X
Out-of-Pocket Maximum: $X
Plan Type: [HMO/PPO/etc.]
Network: [Insurance company name]
Primary Care Copay: $X
Specialist Copay: $X
Emergency Room Cost: $X
Urgent Care Cost: $X
Prescription Drug Coverage: [Formulary tier/coverage details]
Pediatric Dental & Vision: [Included/Not included for kids under 19]
Adult Dental & Vision: [Add-on options available/costs]

REAL-WORLD SCENARIO: HOW THIS PLAN WORKS
Create a realistic patient journey that shows how costs accumulate. Use this format as a guide:

• Sarah has met $200 of her $1,500 deductible so far this year. She visits her doctor for persistent headaches and pays her $25 primary care copay.

• Her doctor orders an MRI ($800 billed). Since Sarah has $1,300 remaining on her deductible, she pays the full $800. Her deductible is now $500 away from being met.

• The MRI reveals a minor issue requiring a specialist. Sarah sees a neurologist and pays her $50 specialist copay. The specialist prescribes medication.

• At the pharmacy, her Tier 2 brand-name medication costs $45 copay per month.

• SUMMARY: Sarah paid $920 total ($25 + $800 + $50 + $45). She still has $500 left on her deductible before her plan starts covering 80% of costs. Her monthly prescriptions will continue at $45 until she hits her $6,000 out-of-pocket maximum.

Adapt this style using the ACTUAL numbers and features from this specific plan. Show where the patient starts financially, explain why they pay what they pay at each step, track their deductible progress, and end with a summary of total paid plus what happens going forward.

CRITICAL: Only report information that is EXPLICITLY stated in the document. If a value is not provided (like Monthly Premium), write "Not listed in document" instead of estimating or making up a number. NEVER guess or estimate any costs, copays, or plan details.

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
Compare these ${fileData.length} insurance plans and provide your response in this EXACT format with these 3 sections:

THE BOTTOM LINE
Write a friendly, conversational summary explaining who should choose each plan. Use full sentences, not bullet points. Use this format as a guide:

"These plans have different trade-offs. Here's who should pick each:

Choose Plan A if you're young, healthy, and rarely visit the doctor. You'll pay less each month ($180 premium) but more out of pocket if something happens. This plan rewards people who don't use much healthcare.

Choose Plan B if you have kids, ongoing prescriptions, or see doctors regularly. You'll pay more monthly ($320 premium) but your visits and medications cost less. This plan is better if you actually use your insurance."

Write 1 paragraph per plan explaining who it's best for and why, using specific dollar amounts. Be warm and helpful, like you're explaining to a friend.

SIDE-BY-SIDE NUMBERS
Create a simple comparison table. Use this exact format:

                            Plan A          Plan B
Monthly Premium:            $180            $320
Annual Deductible:          $2,000          $500
Out-of-Pocket Maximum:      $6,500          $4,000
Primary Care Visit:         $40             $20
Specialist Visit:           $60             $35
Emergency Room:             $300            $150
Urgent Care:                $50             $30
Prescriptions:              Higher copays   Lower copays

Include all key cost categories. Use "Not listed" if a value isn't in the document.

PLAN DETAILS
For each plan, provide a card with key info:

${fileData.map((f, i) => `PLAN ${String.fromCharCode(65 + i)} (${f.name})
Best for: [One sentence describing the ideal person for this plan]

Key Numbers:
• Monthly Premium (what you pay every month): $X
• Annual Deductible (what you pay before insurance kicks in): $X
• Out-of-Pocket Max (the most you'd pay in a year): $X
• Primary Care Visit: $X
• Specialist Visit: $X
• Emergency Room: $X
• Urgent Care: $X

CHOOSE THIS PLAN IF:
• [Specific life situation where this plan wins]
• [Another good reason to pick this plan]
• [Who benefits most from this plan's structure]

WATCH OUT FOR:
• [Main downside or limitation in plain language]
• [Situations where this plan costs more]
• [Important coverage gaps to know about]
`).join('\n')}

CRITICAL: Only report information that is EXPLICITLY stated in the documents. If a value is not provided, write "Not listed" instead of estimating. NEVER guess or make up numbers.

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