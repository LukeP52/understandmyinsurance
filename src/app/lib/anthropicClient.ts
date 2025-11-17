import Anthropic from '@anthropic-ai/sdk'
import { validateContent } from './phiProtection'
import { truncateText } from './costControl'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface AnalysisRequest {
  files: Array<{ filename: string; content: string; type: string }>
  urls: Array<{ url: string; content: string }>
}

export interface AnalysisResponse {
  summary: string
  simpleBullets?: {
    whatItCovers: string[]
    whatYouPay: string[]
    importantRules: string[]
  }
  bottomLine?: string
  nextSteps?: string[]
  redFlags?: string[]
  planType?: string
  // Legacy format support
  keyPoints?: {
    covered: string[]
    limitations: string[]
    costs: {
      monthlyPremium?: string
      deductible?: string
      outOfPocketMax?: string
      copays?: string[]
    }
  }
  recommendations?: string[]
  comparison?: string
  warnings: string[]
  metadata: {
    filesProcessed: number
    urlsProcessed: number
    totalContent: number
    estimatedTokens: number
  }
}

export async function analyzeInsurancePlans(request: AnalysisRequest): Promise<AnalysisResponse> {
  // Validate and sanitize content
  const sanitizedContent = await sanitizeAndValidateContent(request)
  
  // Create analysis prompt
  const prompt = createAnalysisPrompt(sanitizedContent)
  
  // Call Claude API
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 4000,
    temperature: 0.1,
    messages: [{
      role: 'user',
      content: prompt
    }]
  })

  // Parse response
  const analysisText = response.content[0].type === 'text' ? response.content[0].text : ''
  
  return parseAnalysisResponse(analysisText, request)
}

async function sanitizeAndValidateContent(request: AnalysisRequest) {
  const warnings: string[] = []
  const sanitizedFiles: Array<{ filename: string; content: string; type: string }> = []
  const sanitizedUrls: Array<{ url: string; content: string }> = []

  // Process files
  for (const file of request.files) {
    const validation = validateContent(file.content, file.filename)
    
    if (!validation.isAcceptable) {
      warnings.push(`File "${file.filename}" was rejected: ${validation.issues.join(', ')}`)
      continue
    }

    sanitizedFiles.push({
      filename: file.filename,
      content: truncateText(validation.sanitizedContent || file.content),
      type: file.type
    })

    if (validation.riskLevel === 'medium') {
      warnings.push(`File "${file.filename}": ${validation.issues.join(', ')}`)
    }
  }

  // Process URLs
  for (const urlData of request.urls) {
    const validation = validateContent(urlData.content)
    
    if (!validation.isAcceptable) {
      warnings.push(`URL "${urlData.url}" was rejected: ${validation.issues.join(', ')}`)
      continue
    }

    sanitizedUrls.push({
      url: urlData.url,
      content: truncateText(validation.sanitizedContent || urlData.content)
    })

    if (validation.riskLevel === 'medium') {
      warnings.push(`URL content: ${validation.issues.join(', ')}`)
    }
  }

  if (sanitizedFiles.length === 0 && sanitizedUrls.length === 0) {
    throw new Error('No acceptable content found for analysis. Please upload generic plan documents only.')
  }

  return { files: sanitizedFiles, urls: sanitizedUrls, warnings }
}

function createAnalysisPrompt(content: { files: any[], urls: any[], warnings: string[] }): string {
  const filesContent = content.files.map(f => 
    `--- ${f.filename} (${f.type}) ---\n${f.content}\n`
  ).join('\n')

  const urlsContent = content.urls.map(u => 
    `--- ${u.url} ---\n${u.content}\n`
  ).join('\n')

  return `
You are helping someone understand their insurance plan in the SIMPLEST possible way. Pretend you're explaining this to a friend who knows nothing about insurance.

${filesContent}
${urlsContent}

Please provide your analysis in the following JSON format:

{
  "summary": "A simple 2-3 sentence explanation of what this insurance plan does, using everyday language a teenager could understand",
  "simpleBullets": {
    "whatItCovers": ["List 3-5 main things this plan pays for, in simple terms like 'Doctor visits' or 'Emergency room'"],
    "whatYouPay": ["List the main costs you'll pay, like '$50 each time you see a specialist' or '$2,000 deductible before insurance kicks in'"],
    "importantRules": ["List 2-3 key rules or limitations, like 'Must use doctors in network' or 'Need referral to see specialists'"]
  },
  "bottomLine": "One sentence summary of whether this is a good deal and what to watch out for",
  "nextSteps": ["2-3 simple actions the person should take, like 'Find out which doctors are in-network' or 'Set aside money for deductible'"],
  "redFlags": ["Any major concerns or gotchas to watch out for"],
  "planType": "Type of insurance (health, dental, vision, etc.)"
}

CRITICAL INSTRUCTIONS:
- Write like you're texting a friend - use simple words
- NO insurance jargon (deductible is ok, but explain it simply)
- Focus on what actually matters day-to-day
- Be specific about dollar amounts when available
- If something is confusing or missing, say "This document doesn't clearly explain [X]"
- Think: "What would I want to know if this was MY insurance?"
- Use concrete examples: instead of "preventive care" say "yearly checkups and vaccines"
`.trim()
}

function parseAnalysisResponse(analysisText: string, originalRequest: AnalysisRequest): AnalysisResponse {
  try {
    // Try to parse as JSON first
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      
      return {
        summary: parsed.summary || 'Analysis completed',
        simpleBullets: parsed.simpleBullets || undefined,
        bottomLine: parsed.bottomLine || undefined,
        nextSteps: parsed.nextSteps || [],
        redFlags: parsed.redFlags || [],
        planType: parsed.planType || undefined,
        // Legacy support
        keyPoints: parsed.keyPoints || {
          covered: parsed.simpleBullets?.whatItCovers || [],
          limitations: parsed.simpleBullets?.importantRules || [],
          costs: {}
        },
        recommendations: parsed.recommendations || parsed.nextSteps || [],
        comparison: parsed.comparison || (originalRequest.files.length + originalRequest.urls.length > 1 ? 'Multiple plans were analyzed' : undefined),
        warnings: [],
        metadata: {
          filesProcessed: originalRequest.files.length,
          urlsProcessed: originalRequest.urls.length,
          totalContent: calculateTotalContent(originalRequest),
          estimatedTokens: Math.ceil(analysisText.length / 4)
        }
      }
    }
  } catch (error) {
    console.error('Failed to parse JSON response, falling back to text parsing')
  }

  // Fallback to text parsing
  return {
    summary: analysisText.substring(0, 500) + '...',
    keyPoints: {
      covered: ['Analysis completed - see summary for details'],
      limitations: ['Please review the full analysis'],
      costs: {}
    },
    recommendations: ['Review the complete analysis above'],
    warnings: ['Response parsing incomplete - raw analysis provided'],
    metadata: {
      filesProcessed: originalRequest.files.length,
      urlsProcessed: originalRequest.urls.length,
      totalContent: calculateTotalContent(originalRequest),
      estimatedTokens: Math.ceil(analysisText.length / 4)
    }
  }
}

function calculateTotalContent(request: AnalysisRequest): number {
  const fileContent = request.files.reduce((sum, f) => sum + f.content.length, 0)
  const urlContent = request.urls.reduce((sum, u) => sum + u.content.length, 0)
  return fileContent + urlContent
}