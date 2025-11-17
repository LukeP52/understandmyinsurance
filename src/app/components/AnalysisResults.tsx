'use client'

interface AnalysisResultsProps {
  results: {
    summary: string
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
    warnings?: string[]
    metadata?: {
      filesProcessed: number
      urlsProcessed: number
      estimatedTokens: number
      cached?: boolean
    }
    // Legacy support
    plans?: number
    [key: string]: any
  }
}

export default function AnalysisResults({ results }: AnalysisResultsProps) {
  return (
    <div className="max-w-4xl mx-auto mb-12">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-black mb-6">Your Insurance Analysis</h2>
        
        <div className="space-y-8">
          {/* Warnings */}
          {results.warnings && results.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-amber-800 mb-2">⚠️ Processing Notes</h4>
              <ul className="text-amber-700 text-sm space-y-1">
                {results.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary Section */}
          <div>
            <h3 className="text-xl font-semibold text-black mb-4">Plain Language Summary</h3>
            <div className="bg-beige-50 rounded-lg p-6">
              <p className="text-gray-800 leading-relaxed">
                {results.summary}
              </p>
            </div>
          </div>

          {/* Key Coverage Points */}
          {results.keyPoints && (
            <div>
              <h3 className="text-xl font-semibold text-black mb-4">Key Coverage Points</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {results.keyPoints.covered.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">✅ What's Covered</h4>
                    <ul className="text-green-700 text-sm space-y-1">
                      {results.keyPoints.covered.map((item, index) => (
                        <li key={index}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {results.keyPoints.limitations.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Limits</h4>
                    <ul className="text-yellow-700 text-sm space-y-1">
                      {results.keyPoints.limitations.map((item, index) => (
                        <li key={index}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cost Breakdown */}
          {results.keyPoints?.costs && Object.keys(results.keyPoints.costs).length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-black mb-4">Cost Breakdown</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  {results.keyPoints.costs.monthlyPremium && (
                    <div>
                      <div className="text-2xl font-bold text-black">{results.keyPoints.costs.monthlyPremium}</div>
                      <div className="text-sm text-gray-600">Monthly Premium</div>
                    </div>
                  )}
                  {results.keyPoints.costs.deductible && (
                    <div>
                      <div className="text-2xl font-bold text-black">{results.keyPoints.costs.deductible}</div>
                      <div className="text-sm text-gray-600">Annual Deductible</div>
                    </div>
                  )}
                  {results.keyPoints.costs.outOfPocketMax && (
                    <div>
                      <div className="text-2xl font-bold text-black">{results.keyPoints.costs.outOfPocketMax}</div>
                      <div className="text-sm text-gray-600">Out-of-Pocket Max</div>
                    </div>
                  )}
                </div>
                
                {results.keyPoints.costs.copays && results.keyPoints.costs.copays.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Copays</h4>
                    <div className="flex flex-wrap gap-2">
                      {results.keyPoints.costs.copays.map((copay, index) => (
                        <span key={index} className="bg-white px-3 py-1 rounded text-sm text-gray-700">
                          {copay}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {results.recommendations && results.recommendations.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-black mb-4">Recommendations</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <ul className="space-y-2 text-blue-800">
                  {results.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Plan Comparison */}
          {results.comparison && (
            <div>
              <h3 className="text-xl font-semibold text-black mb-4">Plan Comparison</h3>
              <div className="bg-beige-50 rounded-lg p-6">
                <p className="text-gray-800">{results.comparison}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          {results.metadata && (
            <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-500">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>Files processed: {results.metadata.filesProcessed}</div>
                <div>URLs processed: {results.metadata.urlsProcessed}</div>
                <div>Est. tokens: {results.metadata.estimatedTokens}</div>
                {results.metadata.cached && <div>✓ Cached result</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}