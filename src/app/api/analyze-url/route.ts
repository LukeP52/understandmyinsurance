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
CRITICAL RULE - READ THIS FIRST: Only report information EXPLICITLY stated in the content. If ANY value is not provided, you MUST write "Not listed in document" for that field. NEVER estimate, guess, or infer any costs, premiums, copays, or plan details. When in doubt, write "Not listed in document".

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
Monthly Premium: [exact value from content, or "Not listed in document"]
Annual Deductible: [exact value from content, or "Not listed in document"]
Out-of-Pocket Maximum: [exact value from content, or "Not listed in document"]
Plan Type: [exact value from content, or "Not listed in document"]
Network: [exact value from content, or "Not listed in document"]
Primary Care Copay: [exact value from content, or "Not listed in document"]
Specialist Copay: [exact value from content, or "Not listed in document"]
Emergency Room Cost: [exact value from content, or "Not listed in document"]
Urgent Care Cost: [exact value from content, or "Not listed in document"]
Prescription Drug Coverage: [exact value from content, or "Not listed in document"]
Pediatric Dental & Vision: [exact value from content, or "Not listed in document"]
Adult Dental & Vision: [exact value from content, or "Not listed in document"]

REAL-WORLD SCENARIO: HOW THIS PLAN WORKS
Using ONLY the actual numbers found in this content, create a realistic patient journey. If deductible, copays, or coinsurance values aren't specified, state "cost details not provided in document" for those steps.

• [Patient visits doctor - use the content's primary care copay, or state "copay not listed"]
• [Patient needs a test/procedure - explain deductible impact using content's deductible, or state "deductible not listed"]
• [Specialist visit - use content's specialist copay, or state "specialist copay not listed"]
• [Prescription - use content's drug tier costs, or state "prescription costs not listed"]
• SUMMARY: Total costs based ONLY on values explicitly stated in the content

DO NOT invent any dollar amounts. If the content doesn't specify a cost, say "not listed in document" for that item.

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
CRITICAL RULE - READ THIS FIRST: Only report information EXPLICITLY stated in the content. If ANY value is not provided, you MUST write "Not listed" for that field. NEVER estimate, guess, or infer any costs, premiums, copays, or plan details. When in doubt, write "Not listed".

Compare these ${webpageContents.length} insurance plans and provide your response in this EXACT format with these 3 sections:

${webpageContents.map((wc, i) => `
--- PLAN ${String.fromCharCode(65 + i)} (from ${new URL(wc.url).hostname}) ---
${wc.content}
`).join('\n')}

THE BOTTOM LINE
Write a friendly, conversational summary explaining who should choose each plan. Use full sentences, not bullet points. Write 1 paragraph per plan explaining who it's best for and why. Only mention specific dollar amounts that are EXPLICITLY stated in the content. If a cost isn't listed, don't mention it.

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

Include all 13 categories above. For costs, include copays ($X), coinsurance (X%), or both (e.g., "$300 + 20%") - whatever the plan specifies. Use "Not listed" if a value isn't in the content. DO NOT estimate or guess any values. Each row MUST have the category name, then |, then Plan A value, then |, then Plan B value.

PLAN DETAILS
For each plan, provide a card with key info:

${webpageContents.map((wc, i) => `PLAN ${String.fromCharCode(65 + i)} (${new URL(wc.url).hostname})
Best for: [One sentence describing the ideal person for this plan]

Key Numbers:
• Monthly Premium (what you pay every month): [exact value from content, or "Not listed"]
• Annual Deductible (what you pay before insurance kicks in): [exact value from content, or "Not listed"]
• Out-of-Pocket Max (the most you'd pay in a year): [exact value from content, or "Not listed"]
• Primary Care Visit: [exact value from content, or "Not listed"]
• Specialist Visit: [exact value from content, or "Not listed"]
• Emergency Room: [exact value from content, or "Not listed"]
• Urgent Care: [exact value from content, or "Not listed"]

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
