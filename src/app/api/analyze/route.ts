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
A real world care scenario with 3 to 5 bullets that shows a simple patient journey with specific costs. Include dollar amounts for key steps and have the last bullet be a summary of total costs from the example.

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

      let comparePrompt = `
Compare these insurance plans and provide your response in this EXACT format:

COMPARISON SUMMARY
[Write a 3-4 sentence paragraph explaining the key differences between these plans and which types of consumers should choose each one. For example: young/healthy people, families with children, people with chronic conditions, budget-conscious consumers, etc.]

PLAN COMPARISON TABLE
Monthly Premium: Plan A: $X | Plan B: $X${fileData.length > 2 ? ' | Plan C: $X' : ''}${fileData.length > 3 ? ' | Plan D: $X' : ''}
Annual Deductible: Plan A: $X | Plan B: $X${fileData.length > 2 ? ' | Plan C: $X' : ''}${fileData.length > 3 ? ' | Plan D: $X' : ''}
Out-of-Pocket Maximum: Plan A: $X | Plan B: $X${fileData.length > 2 ? ' | Plan C: $X' : ''}${fileData.length > 3 ? ' | Plan D: $X' : ''}
Plan Type: Plan A: [HMO/PPO] | Plan B: [HMO/PPO]${fileData.length > 2 ? ' | Plan C: [HMO/PPO]' : ''}${fileData.length > 3 ? ' | Plan D: [HMO/PPO]' : ''}
Network: Plan A: [Insurance company] | Plan B: [Insurance company]${fileData.length > 2 ? ' | Plan C: [Insurance company]' : ''}${fileData.length > 3 ? ' | Plan D: [Insurance company]' : ''}
Primary Care Copay: Plan A: $X | Plan B: $X${fileData.length > 2 ? ' | Plan C: $X' : ''}${fileData.length > 3 ? ' | Plan D: $X' : ''}
Specialist Copay: Plan A: $X | Plan B: $X${fileData.length > 2 ? ' | Plan C: $X' : ''}${fileData.length > 3 ? ' | Plan D: $X' : ''}
Emergency Room Cost: Plan A: $X | Plan B: $X${fileData.length > 2 ? ' | Plan C: $X' : ''}${fileData.length > 3 ? ' | Plan D: $X' : ''}
Urgent Care Cost: Plan A: $X | Plan B: $X${fileData.length > 2 ? ' | Plan C: $X' : ''}${fileData.length > 3 ? ' | Plan D: $X' : ''}
Prescription Drug Coverage: Plan A: [Coverage details] | Plan B: [Coverage details]${fileData.length > 2 ? ' | Plan C: [Coverage details]' : ''}${fileData.length > 3 ? ' | Plan D: [Coverage details]' : ''}
Pediatric Dental & Vision: Plan A: [Y/N] | Plan B: [Y/N]${fileData.length > 2 ? ' | Plan C: [Y/N]' : ''}${fileData.length > 3 ? ' | Plan D: [Y/N]' : ''}
Adult Dental & Vision: Plan A: [Available/Cost] | Plan B: [Available/Cost]${fileData.length > 2 ? ' | Plan C: [Available/Cost]' : ''}${fileData.length > 3 ? ' | Plan D: [Available/Cost]' : ''}

PLAN RECOMMENDATIONS
Plan A (${fileData[0]?.name || 'First Plan'}): This plan would be good to choose if [explain who should choose this and why, include specific costs like premium and deductible]. [Add 2-3 sentences about the main benefits and coverage features]. However, watch out for [describe main downsides, limitations, or higher costs]. [Include total paragraph length of 4-6 sentences with specific details].

Plan B (${fileData[1]?.name || 'Second Plan'}): This plan would be good to choose if [explain who should choose this and why, include specific costs like premium and deductible]. [Add 2-3 sentences about the main benefits and coverage features]. However, watch out for [describe main downsides, limitations, or higher costs]. [Include total paragraph length of 4-6 sentences with specific details].
`

      // Add additional plans only if they exist
      if (fileData.length > 2) {
        comparePrompt += `
Plan C (${fileData[2].name}): This plan would be good to choose if [explain who should choose this and why, include specific costs like premium and deductible]. [Add 2-3 sentences about the main benefits and coverage features]. However, watch out for [describe main downsides, limitations, or higher costs]. [Include total paragraph length of 4-6 sentences with specific details].
`
      }
      
      if (fileData.length > 3) {
        comparePrompt += `
Plan D (${fileData[3].name}): This plan would be good to choose if [explain who should choose this and why, include specific costs like premium and deductible]. [Add 2-3 sentences about the main benefits and coverage features]. However, watch out for [describe main downsides, limitations, or higher costs]. [Include total paragraph length of 4-6 sentences with specific details].
`
      }
      
      comparePrompt += `
Use simple language. Keep sentences under 40 words.
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