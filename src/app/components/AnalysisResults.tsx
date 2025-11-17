'use client'

interface AnalysisResultsProps {
  results: {
    summary: string
    plans: number
    [key: string]: any
  }
}

export default function AnalysisResults({ results }: AnalysisResultsProps) {
  return (
    <div className="max-w-4xl mx-auto mb-12">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-black mb-6">Your Insurance Analysis</h2>
        
        <div className="space-y-8">
          {/* Summary Section */}
          <div>
            <h3 className="text-xl font-semibold text-black mb-4">Plain Language Summary</h3>
            <div className="bg-beige-50 rounded-lg p-6">
              <p className="text-gray-800 leading-relaxed">
                {results.summary}
              </p>
            </div>
          </div>

          {/* Key Coverage Points (Placeholder) */}
          <div>
            <h3 className="text-xl font-semibold text-black mb-4">Key Coverage Points</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">✅ What's Covered</h4>
                <ul className="text-green-700 text-sm space-y-1">
                  <li>• Emergency medical care</li>
                  <li>• Prescription medications</li>
                  <li>• Preventive care visits</li>
                  <li>• Specialist consultations</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Limits</h4>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• $2,000 annual deductible</li>
                  <li>• 20% coinsurance after deductible</li>
                  <li>• $50 specialist copay</li>
                  <li>• Out-of-network not covered</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Cost Breakdown (Placeholder) */}
          <div>
            <h3 className="text-xl font-semibold text-black mb-4">Cost Breakdown</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-black">$350</div>
                  <div className="text-sm text-gray-600">Monthly Premium</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-black">$2,000</div>
                  <div className="text-sm text-gray-600">Annual Deductible</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-black">$8,000</div>
                  <div className="text-sm text-gray-600">Out-of-Pocket Max</div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div>
            <h3 className="text-xl font-semibold text-black mb-4">Recommendations</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <ul className="space-y-2 text-blue-800">
                <li>• Schedule your annual preventive care visit (covered 100%)</li>
                <li>• Consider using in-network providers to maximize coverage</li>
                <li>• Set aside money for your deductible throughout the year</li>
                <li>• Review your prescription coverage for any medications you take regularly</li>
              </ul>
            </div>
          </div>

          {results.plans > 1 && (
            <div>
              <h3 className="text-xl font-semibold text-black mb-4">Plan Comparison</h3>
              <div className="bg-beige-50 rounded-lg p-6">
                <p className="text-gray-800">
                  You uploaded {results.plans} plans. Here's how they compare:
                </p>
                <div className="mt-4 text-sm text-gray-600">
                  <em>Detailed plan comparison will be available when AI analysis is implemented.</em>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}