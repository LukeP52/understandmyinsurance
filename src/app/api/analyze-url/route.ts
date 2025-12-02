import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { convert } from 'html-to-text'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Simple in-memory rate limiter (shared concept with main analyze route)
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

// Fetch and convert webpage to text
async function fetchWebpageContent(url: string): Promise<string> {
  // Add timeout to prevent hanging on slow/unresponsive servers
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; InsuranceAnalyzer/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()

    // Convert HTML to plain text
    const text = convert(html, {
      wordwrap: false,
      selectors: [
        { selector: 'a', options: { ignoreHref: true } },
        { selector: 'img', format: 'skip' },
        { selector: 'script', format: 'skip' },
        { selector: 'style', format: 'skip' },
        { selector: 'nav', format: 'skip' },
        { selector: 'footer', format: 'skip' },
        { selector: 'header', format: 'skip' },
      ],
    })

    // Limit text length to avoid token limits
    const maxLength = 50000
    return text.length > maxLength ? text.substring(0, maxLength) + '...[truncated]' : text
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. The website took too long to respond.')
    }
    throw error
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
    const { urls, userId, mode = 'single' } = body

    // Check rate limit
    if (!userId || isRateLimited(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a minute before trying again.' },
        { status: 429 }
      )
    }

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: urls' },
        { status: 400 }
      )
    }

    // Validate URLs and check for SSRF
    for (const url of urls) {
      try {
        const parsed = new URL(url)

        // Only allow http/https protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return NextResponse.json(
            { error: 'Only http and https URLs are allowed' },
            { status: 400 }
          )
        }

        // Block internal/private IP addresses (SSRF protection)
        const hostname = parsed.hostname.toLowerCase()
        const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']
        if (blockedHosts.includes(hostname)) {
          return NextResponse.json(
            { error: 'Internal URLs are not allowed' },
            { status: 400 }
          )
        }

        // Block private IP ranges
        if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.)/.test(hostname)) {
          return NextResponse.json(
            { error: 'Private network URLs are not allowed' },
            { status: 400 }
          )
        }
      } catch {
        return NextResponse.json(
          { error: `Invalid URL: ${url}` },
          { status: 400 }
        )
      }
    }

    console.log('Starting URL analysis for', urls.length, 'URL(s)')

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    let analysisText: string

    if (mode === 'single' || urls.length === 1) {
      // Single URL analysis
      const webpageContent = await fetchWebpageContent(urls[0])

      const singlePrompt = `
Analyze this insurance plan information from a webpage and provide a clear explanation in plain English.

Here is the webpage content:
---
${webpageContent}
---

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
Create a realistic patient journey that shows how costs accumulate. Use 3-5 bullet points showing:
• A typical doctor visit and what you'd pay
• What happens if you need a specialist or test
• How prescriptions work under this plan
• A summary of total costs in this scenario

CRITICAL: Only report information that is EXPLICITLY stated in the content. If a value is not provided, write "Not listed in document" instead of estimating or making up a number. NEVER guess or estimate any costs, copays, or plan details.

IMPORTANT: Keep ALL sentences to 40 words or less. Use simple language and define insurance terms in parentheses. NEVER use asterisks (*) anywhere in your response. Use bullet points (•) for all sections. Each bullet point must cover a DIFFERENT topic - no repetition.
`

      const result = await model.generateContent(singlePrompt)
      analysisText = result.response.text()

    } else {
      // Multiple URL comparison
      const webpageContents: { url: string; content: string }[] = []

      for (const url of urls) {
        try {
          const content = await fetchWebpageContent(url)
          webpageContents.push({ url, content })
        } catch (error) {
          console.error(`Failed to fetch ${url}:`, error)
          return NextResponse.json(
            { error: `Failed to fetch content from: ${new URL(url).hostname}` },
            { status: 400 }
          )
        }
      }

      const comparePrompt = `
Compare these ${webpageContents.length} insurance plans and provide your response in this EXACT format with these 3 sections:

${webpageContents.map((wc, i) => `
--- PLAN ${String.fromCharCode(65 + i)} (from ${new URL(wc.url).hostname}) ---
${wc.content}
`).join('\n')}

THE BOTTOM LINE
Write a friendly, conversational summary explaining who should choose each plan. Use full sentences, not bullet points. Use this format as a guide:

"These plans have different trade-offs. Here's who should pick each:

Choose Plan A if you're young, healthy, and rarely visit the doctor. You'll pay less each month ($180 premium) but more out of pocket if something happens. This plan rewards people who don't use much healthcare.

Choose Plan B if you have kids, ongoing prescriptions, or see doctors regularly. You'll pay more monthly ($320 premium) but your visits and medications cost less. This plan is better if you actually use your insurance."

Write 1 paragraph per plan explaining who it's best for and why, using specific dollar amounts. Be warm and helpful, like you're explaining to a friend.

SIDE-BY-SIDE NUMBERS
Create a comparison table with one row per line. Use this EXACT format with | as separator:

Category | Plan A | Plan B
Monthly Premium | $180 | $320
Annual Deductible | $2,000 | $500
Out-of-Pocket Maximum | $6,500 | $4,000
Coinsurance | 20% after deductible | 10% after deductible
Plan Type | PPO | HMO
Network | Cigna | Kaiser
Primary Care | $40 copay | $20 copay
Specialist | $60 copay | 20% coinsurance
Emergency Room | $300 + 20% | $150 copay
Urgent Care | $50 copay | $30 copay
Prescription Drugs | $15/$45/$80 tiers | $10/$30/$60 tiers
Pediatric Dental & Vision | Included | Included
Adult Dental & Vision | Add-on available | Not included

Include all 13 categories above. For costs, include copays ($X), coinsurance (X%), or both (e.g., "$300 + 20%") - whatever the plan specifies. Use "Not listed" if a value isn't in the document. Each row MUST have the category name, then |, then Plan A value, then |, then Plan B value.

PLAN DETAILS
For each plan, provide a card with key info:

${webpageContents.map((wc, i) => `PLAN ${String.fromCharCode(65 + i)} (${new URL(wc.url).hostname})
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

      const result = await model.generateContent(comparePrompt)
      analysisText = result.response.text()
    }

    return NextResponse.json({
      success: true,
      analysis: analysisText,
      analyzedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('URL analysis error:', error)

    if (error instanceof Error) {
      console.error('Error message:', error.message)

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
      if (error.message.includes('Failed to fetch URL')) {
        return NextResponse.json(
          { error: 'Could not access that webpage. The site may be blocking automated access. Try uploading a PDF instead.' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          error: 'Analysis failed',
          details: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to analyze URL. Please try again.' },
      { status: 500 }
    )
  }
}
