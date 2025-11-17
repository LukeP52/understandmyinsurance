'use client'

import { useState } from 'react'

export default function PrivacyNotice() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <span className="text-amber-600 text-lg">🛡️</span>
          <h3 className="font-semibold text-amber-800">Privacy Protection Notice</h3>
        </div>
        <button className="text-amber-600 hover:text-amber-800">
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-4 space-y-3 text-sm">
          <div>
            <h4 className="font-semibold text-green-700 mb-1">✅ SAFE to Upload:</h4>
            <ul className="text-green-600 space-y-1 ml-4">
              <li>• Plan summaries and benefit overviews</li>
              <li>• Coverage details and copay schedules</li>
              <li>• Formularies (prescription drug lists)</li>
              <li>• Provider directories and networks</li>
              <li>• Generic plan documents without personal info</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-red-700 mb-1">❌ DO NOT Upload:</h4>
            <ul className="text-red-600 space-y-1 ml-4">
              <li>• Explanation of Benefits (EOB) statements</li>
              <li>• Medical bills, claims, or statements</li>
              <li>• Documents with your name, SSN, or member ID</li>
              <li>• Personal medical records or test results</li>
              <li>• Anything showing your specific medical services</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
            <p className="text-blue-800 text-xs">
              <strong>Why this matters:</strong> We want to help you understand your insurance plan 
              while keeping your personal health information (PHI) completely private. Generic plan 
              documents give us everything needed for analysis without any privacy risks.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}