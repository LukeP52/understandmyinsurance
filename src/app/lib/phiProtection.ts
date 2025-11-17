// PHI Protection and Content Filtering

// Common patterns that indicate PHI or personal information
const PHI_PATTERNS = [
  // Personal identifiers
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN format
  /\b[A-Z]{2}\d{6,10}\b/g, // Member/Policy ID patterns
  /\bMRN[:\s]*\d+/gi, // Medical Record Numbers
  /\bDOB[:\s]*\d{1,2}\/\d{1,2}\/\d{2,4}/gi, // Date of Birth
  
  // Names and addresses (basic patterns)
  /\b\d{1,5}\s+\w+\s+(street|st|avenue|ave|road|rd|lane|ln|drive|dr|court|ct|way|place|pl)\b/gi,
  /\b\d{5}(-\d{4})?\b/g, // ZIP codes
  
  // Medical information
  /\bdiagnosis[:\s]*[A-Z]\d{2}\.\d+/gi, // ICD codes
  /\bcpt[:\s]*\d{5}/gi, // CPT codes
  /\bservice\s+date[:\s]*\d{1,2}\/\d{1,2}\/\d{2,4}/gi,
  /\badmission\s+date[:\s]*\d{1,2}\/\d{1,2}\/\d{2,4}/gi,
  /\bdischarge\s+date[:\s]*\d{1,2}\/\d{1,2}\/\d{2,4}/gi,
  
  // Financial - specific amounts tied to individuals
  /\bamount\s+paid[:\s]*\$[\d,]+\.?\d*/gi,
  /\bpatient\s+responsibility[:\s]*\$[\d,]+\.?\d*/gi,
  /\bdeductible\s+remaining[:\s]*\$[\d,]+\.?\d*/gi,
  
  // Phone numbers
  /\b\(\d{3}\)\s*\d{3}-\d{4}\b/g,
  /\b\d{3}-\d{3}-\d{4}\b/g,
]

// Keywords that indicate EOB or personal medical documents
const EOB_KEYWORDS = [
  'explanation of benefits',
  'eob',
  'claim number',
  'patient name',
  'member name',
  'service date',
  'provider name',
  'amount charged',
  'amount paid',
  'patient responsibility',
  'this is not a bill',
  'claim summary',
  'medical record number',
  'mrn',
  'admission date',
  'discharge date',
  'diagnosis code',
  'procedure code',
]

// Keywords that indicate acceptable plan documents
const PLAN_DOCUMENT_KEYWORDS = [
  'summary of benefits',
  'plan details',
  'coverage summary',
  'benefit overview',
  'plan description',
  'formulary',
  'provider network',
  'copay schedule',
  'deductible information',
  'annual limits',
  'covered services',
  'exclusions',
  'plan year',
  'enrollment guide',
  'member handbook',
]

export interface ContentValidation {
  isAcceptable: boolean
  riskLevel: 'low' | 'medium' | 'high'
  issues: string[]
  sanitizedContent?: string
  suggestions: string[]
}

export function validateContent(content: string, filename?: string): ContentValidation {
  const lowerContent = content.toLowerCase()
  const issues: string[] = []
  const suggestions: string[] = []
  let riskLevel: 'low' | 'medium' | 'high' = 'low'

  // Check for EOB indicators
  const eobMatches = EOB_KEYWORDS.filter(keyword => 
    lowerContent.includes(keyword.toLowerCase())
  )

  if (eobMatches.length > 3) {
    riskLevel = 'high'
    issues.push('Document appears to be an Explanation of Benefits (EOB) or personal medical record')
    suggestions.push('Please upload your plan summary or benefits document instead')
    suggestions.push('Look for documents titled "Summary of Benefits", "Plan Details", or "Coverage Summary"')
  } else if (eobMatches.length > 1) {
    riskLevel = 'medium'
    issues.push('Document may contain personal medical information')
  }

  // Check for PHI patterns
  const phiMatches = PHI_PATTERNS.reduce((count, pattern) => {
    const matches = content.match(pattern)
    return count + (matches?.length || 0)
  }, 0)

  if (phiMatches > 5) {
    riskLevel = 'high'
    issues.push('Document contains multiple personal identifiers')
  } else if (phiMatches > 2) {
    if (riskLevel === 'low') riskLevel = 'medium'
    issues.push('Document may contain personal information')
  }

  // Check filename for clues
  if (filename) {
    const lowerFilename = filename.toLowerCase()
    if (lowerFilename.includes('eob') || 
        lowerFilename.includes('claim') || 
        lowerFilename.includes('bill') ||
        lowerFilename.includes('statement')) {
      riskLevel = 'high'
      issues.push('Filename suggests this is a personal medical document')
    }
  }

  // Check for acceptable plan document indicators
  const planMatches = PLAN_DOCUMENT_KEYWORDS.filter(keyword => 
    lowerContent.includes(keyword.toLowerCase())
  )

  if (planMatches.length > 3) {
    // This looks like a legitimate plan document
    if (riskLevel === 'low') {
      // Only if no other red flags
      suggestions.push('Document appears to be a legitimate plan document')
    }
  }

  // Determine if acceptable
  const isAcceptable = riskLevel === 'low' || (riskLevel === 'medium' && planMatches.length > 2)

  if (!isAcceptable) {
    suggestions.push('For privacy protection, please upload only generic plan documents')
    suggestions.push('Acceptable documents: plan summaries, benefit overviews, formularies, provider directories')
    suggestions.push('Not acceptable: EOBs, claims, bills, personal medical records')
  }

  return {
    isAcceptable,
    riskLevel,
    issues,
    suggestions,
    sanitizedContent: isAcceptable ? sanitizeContent(content) : undefined
  }
}

function sanitizeContent(content: string): string {
  let sanitized = content

  // Remove potential PHI patterns by replacing with generic placeholders
  PHI_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]')
  })

  return sanitized
}

export function generatePrivacyNotice(): string {
  return `
⚠️ PRIVACY PROTECTION NOTICE ⚠️

For your privacy and security, please only upload:
✅ Generic plan documents (plan summaries, benefit overviews)
✅ Formularies and provider directories
✅ Coverage details and copay schedules

❌ DO NOT upload:
❌ Explanation of Benefits (EOB) statements
❌ Medical bills or claims
❌ Personal medical records
❌ Documents with your name, SSN, or member ID

This helps protect your personal health information (PHI) while still allowing us to analyze your insurance coverage.
  `.trim()
}