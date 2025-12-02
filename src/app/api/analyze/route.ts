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
Compare these ${fileData.length} insurance plans and provide your response in this EXACT format with these 4 sections:

WHICH PLAN FITS YOU?
Match user types to specific plans. Use this format as a guide:

• Young & healthy, want lowest monthly cost → Plan A ($180/month, but $2,000 deductible)
• Family with kids needing regular checkups → Plan B (lower copays, pediatric dental included)
• Chronic condition or lots of prescriptions → Plan B (lower drug costs, $500 deductible)
• Want balance of cost and coverage → Plan A (mid-range premium, decent coverage)

Write 3-5 bullets matching real user situations to specific plans with key numbers.

CATEGORY WINNERS
Show which plan wins in each important category. Use this format:

• Lowest Monthly Premium: Plan A ($180/month)
• Lowest Deductible: Plan B ($500 vs $2,000)
• Lowest Out-of-Pocket Max: Plan B ($4,000 vs $6,500)
• Best for Doctor Visits: Plan B ($20 copay vs $40)
• Best for Prescriptions: Plan B (Tier 1: $10, Tier 2: $35)
• Best for Emergencies: Plan B ($150 ER copay vs $300)

Include 6-8 categories with the winning plan and specific dollar amounts. Always show the comparison.

SAME SCENARIO, DIFFERENT COSTS
Pick a realistic medical scenario relevant to these plans (minor injury, managing a condition, having a baby, etc.) and show what each plan would cost. Use this format as a guide:

Scenario: Treating a Sprained Ankle
(Urgent care visit + X-ray + follow-up appointment + prescription pain medication)

• Plan A: $850 total out of pocket
  - Urgent care: $75 copay
  - X-ray: $400 (applied to $2,000 deductible)
  - Follow-up: $40 copay
  - Medication: $35 (Tier 2)

• Plan B: $185 total out of pocket ← Best for this scenario
  - Urgent care: $50 copay
  - X-ray: $45 (already met $500 deductible, 10% coinsurance)
  - Follow-up: $20 copay
  - Medication: $25 (Tier 2)

Why the difference: Plan A's higher deductible means the X-ray cost hits you directly, while Plan B's lower deductible was already met.

Choose a scenario that highlights meaningful differences between these specific plans. Show the math for each plan.

PLAN DETAILS
For each plan, provide a scannable card format:

${fileData.map((f, i) => `PLAN ${String.fromCharCode(65 + i)} (${f.name})
Best for: [One line describing ideal user]

Key Numbers:
• Monthly Premium: $X
• Annual Deductible: $X
• Out-of-Pocket Max: $X
• Primary Care: $X copay
• Specialist: $X copay
• ER: $X
• Urgent Care: $X

CHOOSE IF:
• [Specific situation where this plan wins]
• [Another advantage]
• [Cost benefit]

WATCH OUT:
• [Main downside or limitation]
• [Higher cost area]
• [Coverage gap]
`).join('\n')}

CRITICAL: Only report information that is EXPLICITLY stated in the documents. If a value is not provided (like Monthly Premium), write "Not listed" instead of estimating or making up a number. NEVER guess or estimate any costs, copays, or plan details. Facts only.

IMPORTANT: Use simple language. Keep sentences under 40 words. NEVER use asterisks (*) - use bullet points (•) only. Include specific dollar amounts throughout.
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