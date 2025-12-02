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
  const { user, loading, signOut } = useAuth()

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

      // User should always have a UID (either real or anonymous)
      if (!user?.uid) {
        console.error('Auth state:', { user, loading })
        throw new Error('Not authenticated. Please enable Anonymous auth in Firebase Console and refresh.')
      }
      const result = await uploadDocuments(uploadedFiles, [], user.uid, analysisMode)
      
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
          <h1 className="text-xl font-bold text-black">Understand My Insurance</h1>
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
          <h1 className="text-5xl md:text-7xl font-black font-display text-black mb-6 tracking-tight">
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
                disabled={!canUpload || isUploading || loading}
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
                      {uploadResults.data.analysis.text.includes('WHICH PLAN FITS YOU?') || uploadResults.data.analysis.text.includes('PLAN RECOMMENDATIONS') ? (
                        // Render comparison format with 4 sections
                        (() => {
                          const analysisText = uploadResults.data.analysis.text

                          // Helper to extract section content
                          const extractSection = (start: string, possibleEnds: string[]) => {
                            const startIndex = analysisText.indexOf(start)
                            if (startIndex === -1) return ''

                            let endIndex = analysisText.length
                            for (const end of possibleEnds) {
                              const idx = analysisText.indexOf(end, startIndex + start.length)
                              if (idx !== -1 && idx < endIndex) endIndex = idx
                            }
                            return analysisText.substring(startIndex + start.length, endIndex).trim()
                          }

                          // Parse the 4 new sections
                          const whichPlanSection = extractSection('WHICH PLAN FITS YOU?', ['CATEGORY WINNERS', 'SAME SCENARIO'])
                          const categoryWinnersSection = extractSection('CATEGORY WINNERS', ['SAME SCENARIO', 'PLAN DETAILS'])
                          const scenarioSection = extractSection('SAME SCENARIO, DIFFERENT COSTS', ['PLAN DETAILS'])
                          const planDetailsSection = extractSection('PLAN DETAILS', [])

                          // Parse individual plan cards from PLAN DETAILS
                          const planCards: { name: string; content: string }[] = []
                          const planMatches = planDetailsSection.matchAll(/PLAN ([A-D]) \(([^)]+)\)([\s\S]*?)(?=PLAN [A-D] \(|$)/g)
                          for (const match of planMatches) {
                            planCards.push({
                              name: `Plan ${match[1]} (${match[2]})`,
                              content: match[3].trim()
                            })
                          }

                          return (
                            <div className="space-y-8">
                              {/* Which Plan Fits You? */}
                              {whichPlanSection && (
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg">
                                  <h4 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-100">
                                    Which Plan Fits You?
                                  </h4>
                                  <div className="space-y-3">
                                    {whichPlanSection.split('\n').map((line: string, lineIndex: number) => (
                                      line.trim() && (
                                        <div key={lineIndex} className="text-gray-700 leading-relaxed flex items-start">
                                          <span className="text-blue-600 mr-3 mt-1 font-bold">→</span>
                                          <span className="font-medium">{line.replace(/^[•→]\s*/, '')}</span>
                                        </div>
                                      )
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Category Winners */}
                              {categoryWinnersSection && (
                                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 shadow-lg">
                                  <h4 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-amber-100">
                                    Category Winners
                                  </h4>
                                  <div className="space-y-2">
                                    {categoryWinnersSection.split('\n').map((line: string, lineIndex: number) => {
                                      if (!line.trim()) return null
                                      const cleanLine = line.replace(/^[•]\s*/, '')
                                      return (
                                        <div key={lineIndex} className="text-gray-700 leading-relaxed flex items-start py-1 border-b border-amber-100 last:border-b-0">
                                          <span className="text-amber-600 mr-3 font-bold">🏆</span>
                                          <span className="font-medium">{cleanLine}</span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Same Scenario, Different Costs */}
                              {scenarioSection && (
                                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 shadow-lg">
                                  <h4 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-purple-100">
                                    Same Scenario, Different Costs
                                  </h4>
                                  <div className="space-y-2 whitespace-pre-line text-gray-700 leading-relaxed">
                                    {scenarioSection.split('\n').map((line: string, lineIndex: number) => {
                                      if (!line.trim()) return <br key={lineIndex} />
                                      // Highlight the "best for this scenario" line
                                      if (line.includes('← Best') || line.includes('←')) {
                                        return (
                                          <div key={lineIndex} className="font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded">
                                            {line}
                                          </div>
                                        )
                                      }
                                      // Style the "Why the difference" explanation
                                      if (line.toLowerCase().startsWith('why')) {
                                        return (
                                          <div key={lineIndex} className="mt-4 italic text-gray-600 border-l-4 border-purple-300 pl-3">
                                            {line}
                                          </div>
                                        )
                                      }
                                      return <div key={lineIndex}>{line}</div>
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Plan Details Cards */}
                              {planCards.length > 0 && (
                                <div className="space-y-6">
                                  <h4 className="text-xl font-bold text-gray-900">Plan Details</h4>
                                  {planCards.map((card, index) => {
                                    const lines = card.content.split('\n').filter((l: string) => l.trim())
                                    const bestFor = lines.find((l: string) => l.toLowerCase().startsWith('best for'))
                                    const chooseIfStart = lines.findIndex((l: string) => l.includes('CHOOSE IF'))
                                    const watchOutStart = lines.findIndex((l: string) => l.includes('WATCH OUT'))

                                    return (
                                      <div key={index} className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                                        <h5 className="text-lg font-bold text-gray-900 mb-2">{card.name}</h5>
                                        {bestFor && (
                                          <p className="text-gray-600 italic mb-4">{bestFor.replace(/^best for:\s*/i, 'Best for: ')}</p>
                                        )}

                                        <div className="grid md:grid-cols-2 gap-4">
                                          {/* Key Numbers */}
                                          <div className="bg-gray-50 rounded-lg p-4">
                                            <h6 className="font-semibold text-gray-800 mb-2">Key Numbers</h6>
                                            {lines.filter((l: string) =>
                                              l.includes('$') && !l.includes('CHOOSE') && !l.includes('WATCH')
                                            ).slice(0, 7).map((l: string, i: number) => (
                                              <div key={i} className="text-sm text-gray-700 py-1 border-b border-gray-200 last:border-b-0">
                                                {l.replace(/^[•]\s*/, '')}
                                              </div>
                                            ))}
                                          </div>

                                          {/* Choose If / Watch Out */}
                                          <div className="space-y-4">
                                            {chooseIfStart !== -1 && (
                                              <div className="bg-green-50 rounded-lg p-4">
                                                <h6 className="font-semibold text-green-800 mb-2">✓ Choose If</h6>
                                                {lines.slice(chooseIfStart + 1, watchOutStart !== -1 ? watchOutStart : undefined)
                                                  .filter((l: string) => l.trim() && !l.includes('WATCH'))
                                                  .slice(0, 3)
                                                  .map((l: string, i: number) => (
                                                    <div key={i} className="text-sm text-gray-700 py-1">
                                                      {l.replace(/^[•]\s*/, '• ')}
                                                    </div>
                                                  ))
                                                }
                                              </div>
                                            )}
                                            {watchOutStart !== -1 && (
                                              <div className="bg-red-50 rounded-lg p-4">
                                                <h6 className="font-semibold text-red-800 mb-2">⚠ Watch Out</h6>
                                                {lines.slice(watchOutStart + 1)
                                                  .filter((l: string) => l.trim())
                                                  .slice(0, 3)
                                                  .map((l: string, i: number) => (
                                                    <div key={i} className="text-sm text-gray-700 py-1">
                                                      {l.replace(/^[•]\s*/, '• ')}
                                                    </div>
                                                  ))
                                                }
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
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
                              // Remove the header and get the content
                              const content = section.replace(/^REAL-WORLD SCENARIO[^\n]*\n?/, '').trim()
                              
                              return (
                                <div key={index} className="mb-8">
                                  <h4 className="text-xl font-bold text-gray-900 mb-4">
                                    Real-World Scenario
                                  </h4>
                                  <div className="text-gray-700 leading-relaxed space-y-2">
                                    {content.split('\n').map((line: string, lineIndex: number) => {
                                      const trimmedLine = line.trim()
                                      if (!trimmedLine) return null
                                      
                                      return (
                                        <div key={lineIndex}>
                                          {trimmedLine.startsWith('•') ? (
                                            <div className="flex items-start mb-2">
                                              <span className="text-gray-600 mr-3 mt-1">•</span>
                                              <span>{trimmedLine.replace('• ', '')}</span>
                                            </div>
                                          ) : (
                                            <div className="mb-2">{trimmedLine}</div>
                                          )}
                                        </div>
                                      )
                                    })}
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