'use client'

import { useState } from 'react'

interface ValidationResult {
  isAcceptable: boolean
  riskLevel: 'low' | 'medium' | 'high'
  issues: string[]
  suggestions: string[]
}

interface ContentValidatorProps {
  onValidation: (isValid: boolean) => void
  children: React.ReactNode
}

export default function ContentValidator({ onValidation, children }: ContentValidatorProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const validateFileContent = async (file: File) => {
    setIsValidating(true)
    
    try {
      // Read file content
      const text = await readFileAsText(file)
      
      // Call validation API
      const response = await fetch('/api/validate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          filename: file.name
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setValidationResult(result)
        onValidation(result.isAcceptable)
        
        if (!result.isAcceptable) {
          showValidationWarning(result)
        }
      }
    } catch (error) {
      console.error('Validation error:', error)
    } finally {
      setIsValidating(false)
    }
  }

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const showValidationWarning = (result: ValidationResult) => {
    const message = [
      '⚠️ PRIVACY ALERT ⚠️',
      '',
      'This document may contain personal health information.',
      '',
      'Issues found:',
      ...result.issues.map(issue => `• ${issue}`),
      '',
      'Suggestions:',
      ...result.suggestions.map(suggestion => `• ${suggestion}`)
    ].join('\n')
    
    alert(message)
  }

  return (
    <div>
      {children}
      {isValidating && (
        <div className="mt-2 text-sm text-blue-600">
          🔍 Checking document for privacy compliance...
        </div>
      )}
      {validationResult && !validationResult.isAcceptable && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-semibold text-red-800 mb-2">⚠️ Document Rejected</h4>
          <div className="text-sm text-red-700 space-y-1">
            {validationResult.issues.map((issue, index) => (
              <div key={index}>• {issue}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}