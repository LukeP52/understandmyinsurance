'use client'

import { useState } from 'react'

interface URLInputProps {
  onUrlAdd: (url: string) => void
}

export default function URLInput({ onUrlAdd }: URLInputProps) {
  const [url, setUrl] = useState('')
  const [isValid, setIsValid] = useState(true)

  const validateUrl = (urlString: string) => {
    try {
      const url = new URL(urlString)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.trim()) {
      setIsValid(false)
      return
    }

    const trimmedUrl = url.trim()
    const fullUrl = trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`
    
    if (validateUrl(fullUrl)) {
      onUrlAdd(fullUrl)
      setUrl('')
      setIsValid(true)
    } else {
      setIsValid(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUrl(value)
    setIsValid(true) // Reset validation on input change
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-black">Add Web Links</h3>
      
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8">
        <div className="space-y-4">
          <div className="text-4xl text-center">🔗</div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={url}
                onChange={handleInputChange}
                placeholder="Enter insurance plan URL (e.g., insurance-company.com/plan-details)"
                className={`w-full px-4 py-3 border rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black ${
                  !isValid ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {!isValid && (
                <p className="text-red-500 text-sm mt-1">Please enter a valid URL</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={!url.trim()}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add URL
            </button>
          </form>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-gray-500">
          <strong>Examples:</strong> Plan summary pages, benefits documents, or coverage details from your insurance provider's website
        </div>
        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
          <strong>Privacy reminder:</strong> Only add links to generic plan information, not personal account pages or EOB portals.
        </div>
      </div>
    </div>
  )
}