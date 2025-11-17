import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/app/lib/rateLimiter'
import { getCached, setCached, generateCacheKey } from '@/app/lib/cache'
import { processFile, scrapeURL } from '@/app/lib/fileProcessor'
import { analyzeInsurancePlans } from '@/app/lib/anthropicClient'
import { getCostControlLimits } from '@/app/lib/costControl'

export async function POST(request: NextRequest) {
  try {
    // Get client identifier for rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'anonymous'
    
    // Check rate limits
    const hourlyLimit = checkRateLimit(clientId, 10, 60 * 60 * 1000) // 10 per hour
    const dailyLimit = checkRateLimit(clientId, 50, 24 * 60 * 60 * 1000) // 50 per day
    
    if (!hourlyLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          resetTime: hourlyLimit.resetTime,
          type: 'hourly'
        },
        { status: 429 }
      )
    }
    
    if (!dailyLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Daily rate limit exceeded', 
          resetTime: dailyLimit.resetTime,
          type: 'daily'
        },
        { status: 429 }
      )
    }

    // Parse request
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const urls = JSON.parse(formData.get('urls') as string || '[]') as string[]

    // Validate request
    const limits = getCostControlLimits()
    
    if (files.length + urls.length > limits.maxFilesPerAnalysis) {
      return NextResponse.json(
        { error: `Too many items. Maximum ${limits.maxFilesPerAnalysis} files/URLs per analysis.` },
        { status: 400 }
      )
    }

    // Process files
    const processedFiles = []
    for (const file of files) {
      if (file.size > limits.maxFileSizeMB * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum ${limits.maxFileSizeMB}MB allowed.` },
          { status: 400 }
        )
      }

      try {
        const processed = await processFile(file)
        processedFiles.push(processed)
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
        return NextResponse.json(
          { error: `Failed to process file ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 400 }
        )
      }
    }

    // Process URLs
    const processedUrls = []
    for (const url of urls) {
      try {
        const content = await scrapeURL(url)
        processedUrls.push({ url, content })
      } catch (error) {
        console.error(`Error processing URL ${url}:`, error)
        return NextResponse.json(
          { error: `Failed to process URL ${url}: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 400 }
        )
      }
    }

    // Check cache
    const cacheKey = generateCacheKey(
      JSON.stringify(processedFiles.map(f => f.content)) + 
      JSON.stringify(processedUrls.map(u => u.content))
    )
    
    const cached = getCached(cacheKey)
    if (cached) {
      return NextResponse.json({
        ...cached,
        cached: true,
        metadata: {
          ...cached.metadata,
          cached: true
        }
      })
    }

    // Analyze with Claude
    const analysisRequest = {
      files: processedFiles.map(f => ({
        filename: f.filename,
        content: f.content,
        type: f.type
      })),
      urls: processedUrls
    }

    const analysis = await analyzeInsurancePlans(analysisRequest)
    
    // Cache the result
    setCached(cacheKey, analysis, 60) // Cache for 1 hour

    return NextResponse.json(analysis)

  } catch (error) {
    console.error('Analysis error:', error)
    
    if (error instanceof Error && error.message.includes('Rate limit')) {
      return NextResponse.json(
        { error: 'API rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Analysis failed. Please try again or contact support if the problem persists.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}