'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { uploadDocuments } from '@/lib/uploadService'
import FileUpload from './components/FileUpload'
import AuthModal from './components/Auth/AuthModal'

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadResults, setUploadResults] = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [analysisMode, setAnalysisMode] = useState<'single' | 'compare'>('single')
  const { user, signOut } = useAuth()

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files])
  }


  const handleUpload = async () => {
    // Allow both authenticated and unauthenticated users
    // Use user ID if available, otherwise use anonymous ID

    // Validate file count before processing
    if (analysisMode === 'single' && uploadedFiles.length > 1) {
      alert('Please upload only one PDF for single plan analysis.')
      return
    }
    if (analysisMode === 'compare' && uploadedFiles.length < 2) {
      alert('Please upload at least 2 PDFs to compare plans.')
      return
    }
    if (uploadedFiles.length > 5) {
      alert('Maximum 5 PDFs allowed for comparison.')
      return
    }
    
    // Validate individual file sizes
    for (const file of uploadedFiles) {
      const maxSizeMB = 5
      const maxSizeBytes = maxSizeMB * 1024 * 1024
      if (file.size > maxSizeBytes) {
        alert(`File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum ${maxSizeMB}MB allowed.`)
        return
      }
    }
    
    setIsUploading(true)
    
    try {
      // Check if we have PDF files that will trigger analysis
      const hasPdfFiles = uploadedFiles.some(file => file.type === 'application/pdf')
      if (hasPdfFiles) {
        setIsAnalyzing(true)
      }

      const result = await uploadDocuments(uploadedFiles, [], user?.uid || 'anonymous-user', analysisMode)
      
      setUploadResults({
        success: true,
        data: {
          id: result.id,
          files: uploadedFiles.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type
          })),
          urls: [],
          totalItems: uploadedFiles.length,
          timestamp: new Date().toISOString(),
          analysis: result.analysis
        }
      })

      // Clear the form
      setUploadedFiles([])
      
    } catch (error) {
      console.error('Upload failed:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
      setIsAnalyzing(false)
    }
  }

  const canUpload = uploadedFiles.length > 0

  return (
    <div className="min-h-screen bg-beige-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-green-600">Understand My Insurance</h1>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">Welcome, {user.email}</span>
                <button 
                  onClick={signOut}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="space-x-4">
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-black font-display text-green-600 mb-6 tracking-tight">
            UNDERSTAND<br />MY INSURANCE
          </h1>
          <p className="text-lg md:text-xl text-gray-800 mb-8 max-w-3xl mx-auto leading-relaxed">
            Upload your insurance plan documents and links to organize and store them in one place.
          </p>
        </div>

        {/* Upload Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-black mb-6">Analyze Your Insurance Plans</h2>
            
            {/* Analysis Mode Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 rounded-lg p-1 inline-flex">
                <button
                  onClick={() => setAnalysisMode('single')}
                  className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                    analysisMode === 'single'
                      ? 'bg-black text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Analyze One Plan
                </button>
                <button
                  onClick={() => setAnalysisMode('compare')}
                  className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                    analysisMode === 'compare'
                      ? 'bg-black text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Compare Multiple Plans
                </button>
              </div>
            </div>

            {/* Upload Instructions */}
            <div className="text-center mb-6">
              <p className="text-gray-600">
                {analysisMode === 'single' 
                  ? 'Upload one PDF to get a detailed analysis of your insurance plan'
                  : 'Upload 2-5 PDFs to compare different insurance plans side by side'
                }
              </p>
            </div>
            
            <div className="mb-8">
              <FileUpload onFileUpload={handleFileUpload} onAuthRequired={() => setShowAuthModal(true)} />
            </div>

            {/* Uploaded Files Summary */}
            {uploadedFiles.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-black mb-2">
                  {analysisMode === 'single' ? 'Ready to Analyze:' : `Ready to Compare (${uploadedFiles.length} plans):`}
                </h3>
                <div className="space-y-1 text-sm text-gray-700">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span>📄 {file.name}</span>
                      <div className="flex items-center space-x-2">
                        {analysisMode === 'compare' && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Plan {index + 1}
                          </span>
                        )}
                        <button
                          onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="text-center">
              <button
                onClick={handleUpload}
                disabled={!canUpload || isUploading}
                className="bg-black hover:bg-gray-800 text-white font-bold px-8 py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
{isAnalyzing 
                  ? (analysisMode === 'compare' ? 'Comparing Plans...' : 'Generating Report...') 
                  : isUploading ? 'Uploading...' 
                  : (analysisMode === 'compare' ? 'Compare Plans' : 'Analyze Plan')
                }
              </button>
            </div>
          </div>
        </div>

        {/* Analysis Loading Display */}
        {isAnalyzing && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                  <h2 className="text-2xl font-bold text-black mb-2">Generating Your Report</h2>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Our AI is reading your insurance document and creating a personalized analysis. 
                    This usually takes 10-30 seconds.
                  </p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <div className="flex items-center justify-center space-x-2 text-blue-700 text-sm">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <span className="ml-3 font-medium">Analyzing coverage details...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Analysis Results */}
        {uploadResults && uploadResults.data.analysis && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Your Insurance Plan Explained
                      </h3>
                      <p className="text-sm text-gray-500">
                        Analyzed {new Date(uploadResults.data.analysis.analyzedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-8">
                      {/* Check if this is a comparison result */}
                      {uploadResults.data.analysis.text.includes('PLAN RECOMMENDATIONS') ? (
                        // Render new comparison format
                        (() => {
                          const analysisText = uploadResults.data.analysis.text
                          const sections = analysisText.split('\n\n')
                          
                          // Parse sections
                          const planRecommendations = sections.find((s: string) => s.startsWith('PLAN RECOMMENDATIONS'))?.replace('PLAN RECOMMENDATIONS\n', '').split('\n').filter((line: string) => line.trim() && line.includes(':')) || []
                          const sideByOverview = sections.find((s: string) => s.startsWith('SIDE-BY-SIDE OVERVIEW'))?.replace('SIDE-BY-SIDE OVERVIEW\n', '').split('\n').filter((line: string) => line.trim()) || []
                          const prosAndCons = sections.find((s: string) => s.startsWith('PROS AND CONS'))?.replace('PROS AND CONS\n', '') || ''
                          const detailedComparison = sections.find((s: string) => s.startsWith('DETAILED COMPARISON'))?.replace('DETAILED COMPARISON\n', '').split('\n').filter((line: string) => line.trim()) || []
                          const bottomLine = sections.find((s: string) => s.startsWith('BOTTOM LINE RECOMMENDATION'))?.replace('BOTTOM LINE RECOMMENDATION\n', '') || ''
                          
                          return (
                            <>
                              {/* Debug Info - Remove after testing */}
                              {process.env.NODE_ENV === 'development' && (
                                <div className="bg-red-100 border border-red-300 p-4 mb-4 text-xs">
                                  <p><strong>Debug - Plan Recommendations Found:</strong> {planRecommendations.length}</p>
                                  {planRecommendations.map((rec: string, i: number) => (
                                    <p key={i}><strong>Plan {i + 1}:</strong> {rec}</p>
                                  ))}
                                </div>
                              )}

                              {/* Plan Recommendation Boxes */}
                              <div className={`grid gap-6 mb-8 ${planRecommendations.length === 2 ? 'md:grid-cols-2' : planRecommendations.length === 3 ? 'md:grid-cols-3' : planRecommendations.length >= 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-1'}`}>
                                {planRecommendations.map((rec: string, index: number) => {
                                  if (rec.includes(':') && rec.trim()) {
                                    const colonIndex = rec.indexOf(':')
                                    const planName = rec.substring(0, colonIndex).trim()
                                    const recommendation = rec.substring(colonIndex + 1).trim()
                                    return (
                                      <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg">
                                        <h4 className="text-lg font-bold text-gray-900 mb-3">{planName}</h4>
                                        <p className="text-gray-700 leading-relaxed">{recommendation}</p>
                                      </div>
                                    )
                                  }
                                  return null
                                })}
                              </div>

                              {/* Side-by-Side Plan Details Tables */}
                              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg mb-8">
                                <h4 className="text-xl font-bold text-gray-900 mb-6 text-center">
                                  Plan Details Comparison
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="border-b-2 border-gray-300">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Feature</th>
                                        {planRecommendations.map((rec: string, index: number) => {
                                          if (rec.includes(':') && rec.trim()) {
                                            const colonIndex = rec.indexOf(':')
                                            const planName = rec.substring(0, colonIndex).trim()
                                            return (
                                              <th key={index} className="text-center py-3 px-4 font-semibold text-gray-900 border-l border-gray-300">
                                                {planName}
                                              </th>
                                            )
                                          }
                                          return null
                                        })}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {sideByOverview.map((line: string, lineIndex: number) => {
                                        const parts = line.split(':')
                                        if (parts.length >= 2) {
                                          const category = parts[0].trim()
                                          const values = parts.slice(1).join(':').split('|').map((v: string) => v.trim())
                                          return (
                                            <tr key={lineIndex} className="border-b border-gray-200 hover:bg-gray-50">
                                              <td className="py-3 px-4 font-medium text-gray-900">{category}</td>
                                              {values.map((value: string, valueIndex: number) => (
                                                <td key={valueIndex} className="py-3 px-4 text-center border-l border-gray-200 text-gray-700">
                                                  {value}
                                                </td>
                                              ))}
                                            </tr>
                                          )
                                        }
                                        return null
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Pros for Each Plan */}
                              <div className="grid md:grid-cols-2 gap-6 mb-8">
                                {(() => {
                                  const prosLines = prosAndCons.split('\n').filter((line: string) => line.trim())
                                  const planPros: Record<string, string[]> = {}
                                  
                                  let currentPlan = ''
                                  prosLines.forEach((line: string) => {
                                    if (line.includes('Pros:')) {
                                      currentPlan = line.replace(' Pros:', '').trim()
                                      planPros[currentPlan] = []
                                    } else if (line.includes('Cons:')) {
                                      currentPlan = ''
                                    } else if (currentPlan && line.startsWith('•')) {
                                      planPros[currentPlan].push(line.replace('• ', ''))
                                    }
                                  })
                                  
                                  return Object.entries(planPros).map(([planName, pros], index) => (
                                    <div key={index} className="bg-green-50 border-2 border-green-200 rounded-xl p-6 shadow-lg">
                                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                        <span className="mr-2">✓</span>
                                        {planName} Pros
                                      </h4>
                                      <ul className="space-y-2">
                                        {pros.map((pro: string, proIndex: number) => (
                                          <li key={proIndex} className="flex items-start">
                                            <span className="text-green-600 mr-3 mt-1 font-bold">•</span>
                                            <span className="text-gray-700">{pro}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))
                                })()}
                              </div>

                              {/* Main Differences - High Level */}
                              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6 shadow-lg mb-8">
                                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-center">
                                  <span className="mr-2">🔍</span>
                                  Key Differences for Your Decision
                                </h4>
                                <div className="space-y-3">
                                  {detailedComparison.map((diff: string, index: number) => (
                                    <div key={index} className="bg-white p-4 rounded-lg border border-yellow-200">
                                      <p className="text-gray-700 font-medium">{diff}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Bottom Line Recommendation */}
                              {bottomLine && (
                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 shadow-lg mb-8">
                                  <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">
                                    Bottom Line Recommendation
                                  </h4>
                                  <p className="text-gray-700 leading-relaxed text-center">{bottomLine}</p>
                                </div>
                              )}

                              {/* Detailed Plan Analysis */}
                              <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-gray-900 text-center mb-6">
                                  Detailed Plan Analysis
                                </h3>
                                {sections.filter((section: string) => 
                                  !section.startsWith('PLAN RECOMMENDATIONS') &&
                                  !section.startsWith('SIDE-BY-SIDE OVERVIEW') &&
                                  !section.startsWith('PROS AND CONS') &&
                                  !section.startsWith('DETAILED COMPARISON') &&
                                  !section.startsWith('BOTTOM LINE RECOMMENDATION') &&
                                  section.trim()
                                ).map((section: string, index: number) => {
                                  const lines = section.split('\n')
                                  const title = lines[0]
                                  const content = lines.slice(1).join('\n')
                                  
                                  return (
                                    <div key={index} className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                                      <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-100">
                                        {title}
                                      </h4>
                                      <div className="text-gray-700 leading-relaxed space-y-2">
                                        {content.split('\n').map((line: string, lineIndex: number) => (
                                          line.trim() && (
                                            <div key={lineIndex} className="flex items-start">
                                              {line.startsWith('•') ? (
                                                <>
                                                  <span className="text-blue-500 mr-3 mt-1 font-bold">•</span>
                                                  <span>{line.replace('• ', '')}</span>
                                                </>
                                              ) : (
                                                <span className="whitespace-pre-wrap">{line}</span>
                                              )}
                                            </div>
                                          )
                                        ))}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </>
                          )
                        })()
                      ) : (
                        // Render single plan format - only 4 sections in specified order
                        (() => {
                          const analysisText = uploadResults.data.analysis.text
                          const sections = analysisText.split('\n\n')
                          
                          // Find and order only the 4 specified sections
                          const whatsGoodSection = sections.find((s: string) => s.startsWith("WHAT'S GOOD ABOUT THIS PLAN"))
                          const watchOutSection = sections.find((s: string) => s.startsWith('WHAT TO WATCH OUT FOR'))
                          const planOverviewSection = sections.find((s: string) => s.startsWith('PLAN OVERVIEW'))
                          const realWorldSection = sections.find((s: string) => s.startsWith('REAL-WORLD SCENARIO'))
                          
                          const orderedSections = [whatsGoodSection, watchOutSection, planOverviewSection, realWorldSection].filter(Boolean)
                          
                          return orderedSections.map((section: string, index: number) => {
                            // What's Good section
                            if (section.startsWith("WHAT'S GOOD ABOUT THIS PLAN")) {
                              return (
                                <div key={index} className="bg-green-50 border-2 border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                                  <h4 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-green-100">
                                    What's Good About This Plan
                                  </h4>
                                  <div className="space-y-3">
                                    {section.replace("WHAT'S GOOD ABOUT THIS PLAN\n", '').split('\n').map((line: string, lineIndex: number) => (
                                      line.trim() && (
                                        <div key={lineIndex} className="text-gray-700 leading-relaxed flex items-start">
                                          <span className="text-green-600 mr-3 mt-1 font-bold">•</span>
                                          <span className="font-medium">{line.replace('• ', '')}</span>
                                        </div>
                                      )
                                    ))}
                                  </div>
                                </div>
                              )
                            }
                            
                            // What to Watch Out For section
                            if (section.startsWith('WHAT TO WATCH OUT FOR')) {
                              return (
                                <div key={index} className="bg-red-50 border-2 border-red-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                                  <h4 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-red-100">
                                    What to Watch Out For
                                  </h4>
                                  <div className="space-y-3">
                                    {section.replace('WHAT TO WATCH OUT FOR\n', '').split('\n').map((line: string, lineIndex: number) => (
                                      line.trim() && (
                                        <div key={lineIndex} className="text-gray-700 leading-relaxed flex items-start">
                                          <span className="text-red-600 mr-3 mt-1 font-bold">•</span>
                                          <span className="font-medium">{line.replace('• ', '')}</span>
                                        </div>
                                      )
                                    ))}
                                  </div>
                                </div>
                              )
                            }
                            
                            // Plan Overview section
                            if (section.startsWith('PLAN OVERVIEW')) {
                              const overviewLines = section.replace('PLAN OVERVIEW\n', '').split('\n').filter(line => line.trim())
                              
                              // Define labels with descriptions
                              const labelDefinitions: Record<string, string> = {
                                'Monthly Premium': 'Monthly Premium (what you pay every month)',
                                'Annual Deductible': 'Annual Deductible (amount you pay before insurance helps)',
                                'Out-of-Pocket Maximum': 'Out-of-Pocket Maximum (your yearly spending cap)',
                                'Plan Type': 'Plan Type (affects referral rules)',
                                'Network': 'Network (which doctors/hospitals you can use)',
                                'Primary Care Copay': 'Primary Care Copay (flat fee for doctor visits)',
                                'Specialist Copay': 'Specialist Copay (flat fee for specialist visits)',
                                'Emergency Room Cost': 'Emergency Room Cost (cost for ER visits)',
                                'Urgent Care Cost': 'Urgent Care Cost (cost for urgent care)',
                                'Prescription Drug Coverage': 'Prescription Drug Coverage',
                                'Pediatric Dental & Vision': 'Pediatric Dental & Vision (for kids under 19)',
                                'Adult Dental & Vision': 'Adult Dental & Vision (add-on options)'
                              }
                              
                              return (
                                <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 shadow-lg">
                                  <h4 className="text-xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center">
                                    <span className="mr-2">📊</span>
                                    Plan Details
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {overviewLines.map((line: string, lineIndex: number) => {
                                      const [label, value] = line.split(':').map(s => s.trim())
                                      const labelWithDef = labelDefinitions[label] || label
                                      return (
                                        <div key={lineIndex} className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200">
                                          <div className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-2">{labelWithDef}</div>
                                          <div className="text-lg text-gray-900 font-bold">{value}</div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            }
                            
                            // Real-World Scenario section
                            if (section.startsWith('REAL-WORLD SCENARIO')) {
                              // Remove the header and any empty lines, keep all content
                              const content = section.replace('REAL-WORLD SCENARIO: HOW THIS PLAN WORKS\n', '').trim()
                              
                              return (
                                <div key={index} className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                                  <h4 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-yellow-100">
                                    Real-World Scenario
                                  </h4>
                                  <div className="text-gray-700 leading-relaxed space-y-2">
                                    {content.split('\n').map((line: string, lineIndex: number) => (
                                      line.trim() && (
                                        <div key={lineIndex} className="flex items-start">
                                          {line.match(/^Step \d+/) ? (
                                            <span className="font-bold text-yellow-700">{line}</span>
                                          ) : line.startsWith('Total Patient Cost') || line.startsWith('Key Takeaway') ? (
                                            <span className="font-bold text-gray-900">{line}</span>
                                          ) : line.startsWith('Scenario:') ? (
                                            <span className="italic text-gray-600 font-medium">{line}</span>
                                          ) : (
                                            <span>{line}</span>
                                          )}
                                        </div>
                                      )
                                    ))}
                                  </div>
                                </div>
                              )
                            }
                            
                            return null
                          })
                        })()
                      )}
                    </div>
                  </div>
                </div>
              )}


        {/* How It Works */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-black text-center mb-12">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Upload Documents</h3>
              <p className="text-gray-700">
                Upload PDFs, documents, or paste links to your insurance plan details.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Secure Processing</h3>
              <p className="text-gray-700">
                Your documents are validated and processed securely in our system.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Organized Storage</h3>
              <p className="text-gray-700">
                Keep all your insurance documents organized and accessible in one place.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  )
}