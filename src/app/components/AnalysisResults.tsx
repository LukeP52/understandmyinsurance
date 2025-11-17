'use client'

interface AnalysisResultsProps {
  results: {
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
    // Legacy support
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
            <h3 className="text-xl font-semibold text-black mb-4">What This Plan Does</h3>
            <div className="bg-beige-50 rounded-lg p-6">
              <p className="text-gray-800 leading-relaxed text-lg">
                {results.summary}
              </p>
              {results.planType && (
                <div className="mt-4 text-sm text-gray-600">
                  Plan Type: <span className="font-medium">{results.planType}</span>
                </div>
              )}
            </div>
          </div>

          {/* Simple Bullets */}
          {results.simpleBullets && (
            <div>
              <h3 className="text-xl font-semibold text-black mb-4">The Main Things You Need to Know</h3>
              <div className="space-y-6">
                {results.simpleBullets.whatItCovers.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h4 className="font-bold text-green-800 mb-3 text-lg">💚 What This Plan Covers</h4>
                    <ul className="text-green-700 space-y-2">
                      {results.simpleBullets.whatItCovers.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-600 mr-2 mt-1">•</span>
                          <span className="text-base">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {results.simpleBullets.whatYouPay.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="font-bold text-blue-800 mb-3 text-lg">💰 What You'll Pay</h4>
                    <ul className="text-blue-700 space-y-2">
                      {results.simpleBullets.whatYouPay.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-600 mr-2 mt-1">•</span>
                          <span className="text-base">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {results.simpleBullets.importantRules.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h4 className="font-bold text-yellow-800 mb-3 text-lg">⚠️ Important Rules</h4>
                    <ul className="text-yellow-700 space-y-2">
                      {results.simpleBullets.importantRules.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-yellow-600 mr-2 mt-1">•</span>
                          <span className="text-base">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Line */}
          {results.bottomLine && (
            <div>
              <h3 className="text-xl font-semibold text-black mb-4">Bottom Line</h3>
              <div className="bg-gray-800 text-white rounded-lg p-6">
                <p className="text-lg font-medium">{results.bottomLine}</p>
              </div>
            </div>
          )}

          {/* Red Flags */}
          {results.redFlags && results.redFlags.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-black mb-4">🚨 Watch Out For</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <ul className="text-red-700 space-y-2">
                  {results.redFlags.map((flag, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-600 mr-2 mt-1">•</span>
                      <span className="text-base font-medium">{flag}</span>
                    </li>
                  ))}
                </ul>
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

          {/* Next Steps */}
          {results.nextSteps && results.nextSteps.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-black mb-4">What You Should Do Next</h3>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <ul className="text-purple-700 space-y-3">
                  {results.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-base">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Legacy Recommendations */}
          {results.recommendations && results.recommendations.length > 0 && !results.nextSteps && (
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