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
  keyPoints: {
    covered: string[]
    limitations: string[]
    costs: {
      monthlyPremium?: string
      deductible?: string
      outOfPocketMax?: string
      copays?: string[]
    }
  }
  recommendations: string[]
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
You are an expert insurance analyst. Please analyze the following insurance plan documents and provide a clear, comprehensive summary in plain language that anyone can understand.

${filesContent}
${urlsContent}

Please provide your analysis in the following JSON format:

{
  "summary": "A 2-3 sentence overview of the insurance plan(s) in simple terms",
  "keyPoints": {
    "covered": ["List of what's covered - be specific"],
    "limitations": ["List of important limitations, exclusions, or requirements"],
    "costs": {
      "monthlyPremium": "Amount if mentioned",
      "deductible": "Amount if mentioned", 
      "outOfPocketMax": "Amount if mentioned",
      "copays": ["List specific copay amounts mentioned"]
    }
  },
  "recommendations": ["Actionable advice for the plan holder"],
  "comparison": "If multiple plans provided, compare them briefly",
  "planType": "Type of insurance (health, dental, vision, etc.)"
}

Guidelines:
- Use simple, everyday language - avoid insurance jargon
- Focus on what matters most to consumers: costs, coverage, and limitations
- Be specific about dollar amounts when provided
- If information is missing or unclear, say so
- Prioritize practical, actionable insights
- If you detect any personal information that shouldn't be there, note it as a concern
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
        keyPoints: {
          covered: parsed.keyPoints?.covered || [],
          limitations: parsed.keyPoints?.limitations || [],
          costs: parsed.keyPoints?.costs || {}
        },
        recommendations: parsed.recommendations || [],
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