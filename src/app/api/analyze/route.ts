import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

async function extractPDFText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  // Method 1: Try pdf-parse first (good for most text-based PDFs)
  try {
    const pdfParse = await import('pdf-parse')
    const parseFn = (pdfParse as any).default || pdfParse
    const pdfData = await parseFn(buffer)
    if (pdfData.text && pdfData.text.trim().length > 100) {
      console.log('Successfully extracted text using pdf-parse')
      return pdfData.text
    }
  } catch (error) {
    console.log('pdf-parse failed, trying PDF.js...')
  }

  // Method 2: Try PDF.js for more complex PDFs
  try {
    const pdfjsLib = await import('pdfjs-dist')
    // Set up PDF.js worker
    if (typeof window === 'undefined') {
      const { readFileSync } = await import('fs')
      const workerPath = require.resolve('pdfjs-dist/build/pdf.worker.mjs')
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath
    }

    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
    let fullText = ''
    
    for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 5); pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      fullText += pageText + '\n'
    }

    if (fullText.trim().length > 100) {
      console.log('Successfully extracted text using PDF.js')
      return fullText
    }
  } catch (error) {
    console.log('PDF.js failed, trying OCR...')
  }

  // Method 3: OCR for scanned/image-based PDFs
  try {
    console.log('Attempting OCR extraction...')
    const fs = await import('fs')
    const path = await import('path')
    const os = await import('os')
    
    // Convert PDF to images
    const pdf2pic = await import('pdf2pic')
    const convert = pdf2pic.fromBuffer(buffer, {
      density: 200,           // Higher density for better OCR
      saveFilename: "page",
      savePath: os.tmpdir(),
      format: "png",
      width: 2000,            // Higher resolution
      height: 2000
    })

    // Process first 3 pages only (to keep processing time reasonable)
    const results = await convert.bulk(-1, { responseType: "buffer" })
    let ocrText = ''

    // Import Tesseract
    const Tesseract = await import('tesseract.js')
    
    for (let i = 0; i < Math.min(results.length, 3); i++) {
      const result = results[i]
      if (result.buffer) {
        console.log(`Processing page ${i + 1} with OCR...`)
        const { data: { text } } = await Tesseract.recognize(result.buffer, 'eng', {
          logger: () => {} // Suppress logging
        })
        ocrText += text + '\n'
      }
    }

    if (ocrText.trim().length > 100) {
      console.log('Successfully extracted text using OCR')
      return ocrText
    }
  } catch (ocrError) {
    console.log('OCR failed:', ocrError)
  }

  // Method 4: Try basic text extraction as final fallback
  try {
    const text = buffer.toString('utf8')
    if (text.length > 100) {
      return text
    }
  } catch (error) {
    // Final fallback
  }

  throw new Error('Could not extract text from PDF - file may be corrupted or heavily protected')
}

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
        // Handle PDF files with multiple fallback methods
        try {
          content = await extractPDFText(file)
        } catch (pdfError) {
          return NextResponse.json(
            { error: `Could not read PDF ${file.name}. The PDF might be corrupted, heavily protected, or completely image-based. Please try a different PDF or convert to text format.` },
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