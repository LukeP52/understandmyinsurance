import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    // Check if API key exists
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const urls = JSON.parse(formData.get('urls') as string || '[]') as string[]

    // Basic validation
    if (files.length + urls.length === 0) {
      return NextResponse.json(
        { error: 'No files or URLs provided' },
        { status: 400 }
      )
    }

    // Limit to 3 files/URLs total
    if (files.length + urls.length > 3) {
      return NextResponse.json(
        { error: 'Maximum 3 files/URLs allowed per analysis' },
        { status: 400 }
      )
    }

    // Process files
    const processedContent = []
    
    for (const file of files) {
      // Size limit: 5MB
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum 5MB allowed.` },
          { status: 400 }
        )
      }

      let content = ''

      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        // Handle PDF files
        try {
          const pdfParse = await import('pdf-parse')
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const parseFn = (pdfParse as any).default || pdfParse
          const pdfData = await parseFn(buffer)
          content = pdfData.text
        } catch (pdfError) {
          return NextResponse.json(
            { error: `Could not read PDF ${file.name}. Please try a text-based PDF or convert to a text document.` },
            { status: 400 }
          )
        }
      } else {
        // Handle text files
        const arrayBuffer = await file.arrayBuffer()
        content = new TextDecoder().decode(arrayBuffer)
      }

      // Limit content length to prevent token overflow
      processedContent.push({
        name: file.name,
        content: content.substring(0, 10000)
      })
    }

    // Add URLs (simplified - just pass them to AI for now)
    for (const url of urls) {
      processedContent.push({
        name: `URL: ${url}`,
        content: `Please analyze the insurance plan at this URL: ${url}`
      })
    }

    // Create Claude API client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!
    })

    // Build content for analysis
    const contentText = processedContent
      .map(item => `--- ${item.name} ---\n${item.content}\n`)
      .join('\n')

    // Simple, clear prompt
    const prompt = `You are helping someone understand their insurance plan in the SIMPLEST possible way. 

${contentText}

Please analyze this insurance plan and respond in this exact JSON format:
{
  "summary": "A simple 2-3 sentence explanation in plain English",
  "simpleBullets": {
    "whatItCovers": ["List 3-5 main things covered, like 'Doctor visits' or 'Prescription drugs'"],
    "whatYouPay": ["List costs like '$50 copay for doctor visits' or '$2000 deductible before coverage starts'"],
    "importantRules": ["2-3 key rules or limitations, like 'Must use in-network doctors' or 'Need referral for specialists'"]
  },
  "keyPoints": {
    "costs": {
      "deductible": "Amount if found, or 'Not specified'",
      "monthlyPremium": "Amount if found, or 'Not specified'",
      "copay": "Amount if found, or 'Not specified'"
    }
  },
  "nextSteps": ["2-3 simple next steps like 'Find doctors in your network' or 'Set aside money for deductible'"],
  "warnings": ["Any major concerns to watch out for"]
}

Use simple language a teenager could understand. Focus on what actually matters day-to-day.`

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      temperature: 0.1,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const analysisText = response.content[0].type === 'text' ? response.content[0].text : ''

    // Parse JSON response
    let analysis
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      // Fallback if JSON parsing fails
      analysis = {
        summary: analysisText.substring(0, 300) + '...',
        simpleBullets: {
          whatItCovers: ['Analysis completed - see summary for details'],
          whatYouPay: ['Please review the analysis above'],
          importantRules: ['Contact your insurance provider for specific details']
        },
        keyPoints: {
          costs: {
            deductible: 'Not specified',
            monthlyPremium: 'Not specified',
            copay: 'Not specified'
          }
        },
        nextSteps: ['Contact your insurance provider for specific details'],
        warnings: ['Analysis may be incomplete - please verify details with your insurer']
      }
    }

    // Add basic metadata
    analysis.metadata = {
      filesProcessed: files.length,
      urlsProcessed: urls.length
    }

    return NextResponse.json(analysis)

  } catch (error) {
    console.error('Analysis error:', error)
    
    return NextResponse.json(
      { 
        error: 'Analysis failed. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// CORS support
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}