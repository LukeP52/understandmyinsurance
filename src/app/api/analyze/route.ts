import { NextRequest, NextResponse } from 'next/server'

// Add GET method for testing
export async function GET() {
  try {
    return NextResponse.json({ 
      message: 'Analysis API is working',
      timestamp: new Date().toISOString(),
      env: {
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
        nodeEnv: process.env.NODE_ENV
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'GET method failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('API endpoint called')
    
    // Check if API key exists first
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('API key not configured')
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }
    
    console.log('API key found, proceeding...')

    // Parse request
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const urls = JSON.parse(formData.get('urls') as string || '[]') as string[]

    console.log(`Processing ${files.length} files and ${urls.length} URLs`)

    // Basic validation
    if (files.length + urls.length === 0) {
      return NextResponse.json(
        { error: 'No files or URLs provided' },
        { status: 400 }
      )
    }

    // Process files with better error handling
    const processedFiles = []
    for (const file of files) {
      console.log(`Processing file: ${file.name}, size: ${file.size}`)
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum 5MB allowed.` },
          { status: 400 }
        )
      }

      try {
        let content = ''
        
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          // Handle PDF files
          try {
            const pdfParse = (await import('pdf-parse')).default
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const pdfData = await pdfParse(buffer)
            content = pdfData.text
            console.log(`Extracted PDF text length: ${content.length}`)
          } catch (pdfError) {
            console.error(`PDF parsing failed for ${file.name}:`, pdfError)
            content = `PDF file: ${file.name} - Unable to extract text content. Please try uploading a text-based PDF or convert to a text document.`
          }
        } else {
          // Handle text files
          const arrayBuffer = await file.arrayBuffer()
          content = new TextDecoder().decode(arrayBuffer)
          console.log(`Text file content length: ${content.length}`)
        }
        
        processedFiles.push({
          filename: file.name,
          content: content.substring(0, 15000), // Limit for token management
          type: file.type
        })
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError)
        return NextResponse.json(
          { error: `Failed to process file ${file.name}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}` },
          { status: 400 }
        )
      }
    }

    // Process URLs (simplified for now)
    const processedUrls = urls.map(url => ({
      url,
      content: `Please analyze the insurance plan at: ${url}`
    }))

    console.log('About to call Anthropic API...')

    // Simple direct API call instead of complex import
    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY!
      })

      const filesContent = processedFiles.map(f => 
        `--- ${f.filename} ---\n${f.content}\n`
      ).join('\n')

      const prompt = `
You are helping someone understand their insurance plan in simple terms.

${filesContent}

Please provide a simple analysis in JSON format:
{
  "summary": "A simple explanation of what this insurance plan does",
  "keyPoints": {
    "covered": ["List main things covered"],
    "costs": {"deductible": "amount if found"},
    "limitations": ["Key limitations"]
  },
  "recommendations": ["Simple next steps"],
  "warnings": []
}

Keep it very simple and easy to understand.`

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.1,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const analysisText = response.content[0].type === 'text' ? response.content[0].text : ''
      console.log('Anthropic response received')

      // Try to parse JSON response
      let analysis
      try {
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0])
        } else {
          analysis = {
            summary: analysisText.substring(0, 500),
            keyPoints: { covered: [], costs: {}, limitations: [] },
            recommendations: [],
            warnings: []
          }
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        analysis = {
          summary: analysisText.substring(0, 500),
          keyPoints: { covered: [], costs: {}, limitations: [] },
          recommendations: [],
          warnings: ['Response parsing incomplete - raw analysis provided']
        }
      }

      // Add metadata
      analysis.metadata = {
        filesProcessed: processedFiles.length,
        urlsProcessed: processedUrls.length,
        totalContent: processedFiles.reduce((sum, f) => sum + f.content.length, 0),
        estimatedTokens: Math.ceil(analysisText.length / 4)
      }

      console.log('Analysis completed successfully')
      return NextResponse.json(analysis)

    } catch (anthropicError) {
      console.error('Anthropic API error:', anthropicError)
      return NextResponse.json(
        { 
          error: 'AI analysis failed',
          details: anthropicError instanceof Error ? anthropicError.message : 'Unknown AI error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('General analysis error:', error)
    
    return NextResponse.json(
      { 
        error: 'Analysis failed. Please try again or contact support if the problem persists.',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// TODO: Re-enable full analysis after confirming POST works
/*
    // Import dependencies inside function to avoid build issues
    const { checkRateLimit } = await import('@/app/lib/rateLimiter')
    const { getCached, setCached, generateCacheKey } = await import('@/app/lib/cache')
    const { processFile, scrapeURL } = await import('@/app/lib/fileProcessor')
    const { analyzeInsurancePlans } = await import('@/app/lib/anthropicClient')
    const { getCostControlLimits } = await import('@/app/lib/costControl')
    
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
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
*/

// Add OPTIONS method for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}