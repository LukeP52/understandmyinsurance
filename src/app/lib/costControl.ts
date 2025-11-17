export interface CostControlLimits {
  maxRequestsPerHour: number
  maxRequestsPerDay: number
  maxFileSizeMB: number
  maxFilesPerAnalysis: number
  maxTextLength: number
}

export function getCostControlLimits(): CostControlLimits {
  return {
    maxRequestsPerHour: parseInt(process.env.MAX_REQUESTS_PER_HOUR || '10'),
    maxRequestsPerDay: parseInt(process.env.MAX_REQUESTS_PER_DAY || '50'),
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '5'),
    maxFilesPerAnalysis: parseInt(process.env.MAX_FILES_PER_ANALYSIS || '3'),
    maxTextLength: parseInt(process.env.MAX_TEXT_LENGTH || '50000'),
  }
}

export function validateFileSize(file: File): { valid: boolean; error?: string } {
  const maxSizeMB = getCostControlLimits().maxFileSizeMB
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds limit of ${maxSizeMB}MB`
    }
  }
  
  return { valid: true }
}

export function validateFileCount(fileCount: number): { valid: boolean; error?: string } {
  const maxFiles = getCostControlLimits().maxFilesPerAnalysis
  
  if (fileCount > maxFiles) {
    return {
      valid: false,
      error: `Too many files (${fileCount}). Maximum ${maxFiles} files per analysis.`
    }
  }
  
  return { valid: true }
}

export function truncateText(text: string): string {
  const maxLength = getCostControlLimits().maxTextLength
  
  if (text.length <= maxLength) {
    return text
  }
  
  return text.substring(0, maxLength) + '\n\n[Content truncated due to length limits...]'
}

export function estimateTokenCount(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4)
}

export function estimateCost(tokenCount: number): number {
  // Claude pricing estimate (adjust based on current rates)
  // Input: ~$3 per million tokens, Output: ~$15 per million tokens
  const inputCost = (tokenCount / 1000000) * 3
  const outputCost = (tokenCount * 0.3 / 1000000) * 15 // Assume output is ~30% of input
  return inputCost + outputCost
}