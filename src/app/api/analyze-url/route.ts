import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { convert } from 'html-to-text'
import { getSingleUrlAnalysisPrompt, getCompareUrlAnalysisPrompt, InsuranceType } from '@/lib/prompts'

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
    const { urls, userId, mode = 'single', insuranceType = 'health' } = body
    const validInsuranceType = insuranceType as InsuranceType

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

      const basePrompt = getSingleUrlAnalysisPrompt(validInsuranceType)
      const singlePrompt = `${basePrompt}

Here is the webpage content:
---
${webpageContent}
---`

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

      const basePrompt = getCompareUrlAnalysisPrompt(validInsuranceType, webpageContents)
      const comparePrompt = `${basePrompt}

${webpageContents.map((wc, i) => `
--- PLAN ${String.fromCharCode(65 + i)} (from ${new URL(wc.url).hostname}) ---
${wc.content}
`).join('\n')}`

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
