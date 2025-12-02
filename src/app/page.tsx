'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { uploadDocuments } from '@/lib/uploadService'
import FileUpload from './components/FileUpload'
import AuthModal from './components/Auth/AuthModal'

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [urlInput, setUrlInput] = useState('')
  const [addedUrls, setAddedUrls] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadResults, setUploadResults] = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [analysisMode, setAnalysisMode] = useState<'single' | 'compare'>('single')
  const { user, loading, signOut } = useAuth()

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files])
  }

  const handleAddUrl = (url?: string) => {
    const trimmedUrl = (url || urlInput).trim()
    if (!trimmedUrl) return

    // Basic URL validation
    try {
      new URL(trimmedUrl)
    } catch {
      alert('Please enter a valid URL (e.g., https://example.com/plan-details)')
      return
    }

    // Check for duplicates
    if (addedUrls.includes(trimmedUrl)) {
      alert('This URL has already been added')
      return
    }

    setAddedUrls(prev => [...prev, trimmedUrl])
    setUrlInput('')
  }

  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text').trim()

    // Check if it looks like a URL
    try {
      new URL(pastedText)
      // It's a valid URL - add it automatically
      e.preventDefault() // Prevent the paste from filling the input
      handleAddUrl(pastedText)
    } catch {
      // Not a valid URL - let normal paste behavior happen
    }
  }


  const handleUpload = async () => {
    // Allow both authenticated and unauthenticated users
    // Use user ID if available, otherwise use anonymous ID

    const totalItems = uploadedFiles.length + addedUrls.length

    // Validate item count before processing
    if (analysisMode === 'single' && totalItems > 1) {
      alert('Please provide only one PDF or URL for single plan analysis.')
      return
    }
    if (analysisMode === 'compare' && totalItems < 2) {
      alert('Please provide at least 2 PDFs or URLs to compare plans.')
      return
    }
    if (totalItems > 5) {
      alert('Maximum 5 items allowed for comparison.')
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
    setIsAnalyzing(true)

    try {
      // User should always have a UID (either real or anonymous)
      if (!user?.uid) {
        console.error('Auth state:', { user, loading })
        throw new Error('Not authenticated. Please enable Anonymous auth in Firebase Console and refresh.')
      }

      // If we have URLs, handle them differently
      if (addedUrls.length > 0 && uploadedFiles.length === 0) {
        // URL-only analysis
        const response = await fetch('/api/analyze-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            urls: addedUrls,
            userId: user.uid,
            mode: analysisMode
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to analyze URL')
        }

        const result = await response.json()

        // Check if the analysis contains mostly "not listed/not provided" - indicates JS-rendered page
        const analysisText = result.analysis.toLowerCase()
        const emptyIndicators = [
          'not detailed here',
          'not provided in the document',
          'not mentioned in the information',
          'not listed',
          'not available',
          'information about potential high costs or the deductible is not available',
          'the document does not specify'
        ]
        const emptyCount = emptyIndicators.filter(phrase => analysisText.includes(phrase)).length

        if (emptyCount >= 4) {
          // Most fields are empty - likely a JavaScript-rendered page
          throw new Error(
            'This website uses JavaScript to load its content, which we cannot read directly. ' +
            'Please try downloading the plan\'s PDF (usually called "Summary of Benefits" or "Plan Details") and uploading it instead.'
          )
        }

        setUploadResults({
          success: true,
          data: {
            id: 'url-analysis',
            files: [],
            urls: addedUrls,
            totalItems: addedUrls.length,
            timestamp: new Date().toISOString(),
            analysis: {
              text: result.analysis,
              analyzedAt: result.analyzedAt
            }
          }
        })

        // Clear the form
        setAddedUrls([])
      } else {
        // File upload (existing logic)
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
      }

    } catch (error) {
      console.error('Upload failed:', error)
      alert(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
      setIsAnalyzing(false)
    }
  }

  const canUpload = uploadedFiles.length > 0 || addedUrls.length > 0

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
                  ? 'Upload a PDF or paste a URL to get a detailed analysis of your insurance plan'
                  : 'Upload 2-5 PDFs or URLs to compare different insurance plans side by side'
                }
              </p>
            </div>

            <div className="mb-6">
              <FileUpload onFileUpload={handleFileUpload} onAuthRequired={() => setShowAuthModal(true)} />
            </div>

            {/* URL Input Section */}
            <div className="mb-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or paste a URL</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                  onPaste={handleUrlPaste}
                  placeholder="https://example.com/insurance-plan-details"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <button
                  onClick={() => handleAddUrl()}
                  disabled={!urlInput.trim()}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Paste a link to your insurance plan's Summary of Benefits page
              </p>
            </div>

            {/* Uploaded Files & URLs Summary */}
            {(uploadedFiles.length > 0 || addedUrls.length > 0) && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-black mb-2">
                  {analysisMode === 'single' ? 'Ready to Analyze:' : `Ready to Compare (${uploadedFiles.length + addedUrls.length} plans):`}
                </h3>
                <div className="space-y-1 text-sm text-gray-700">
                  {uploadedFiles.map((file, index) => (
                    <div key={`file-${index}`} className="flex items-center justify-between">
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
                  {addedUrls.map((url, index) => (
                    <div key={`url-${index}`} className="flex items-center justify-between">
                      <span className="truncate max-w-xs">🔗 {new URL(url).hostname}</span>
                      <div className="flex items-center space-x-2">
                        {analysisMode === 'compare' && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            Plan {uploadedFiles.length + index + 1}
                          </span>
                        )}
                        <button
                          onClick={() => setAddedUrls(prev => prev.filter((_, i) => i !== index))}
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
                      {uploadResults.data.analysis.text.includes('THE BOTTOM LINE') || uploadResults.data.analysis.text.includes('SIDE-BY-SIDE NUMBERS') ? (
                        // Render comparison format with 3 sections
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

                          // Parse the 3 sections
                          const bottomLineSection = extractSection('THE BOTTOM LINE', ['SIDE-BY-SIDE NUMBERS', 'PLAN DETAILS'])
                          const sideBySideSection = extractSection('SIDE-BY-SIDE NUMBERS', ['PLAN DETAILS'])
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
                              {/* The Bottom Line */}
                              {bottomLineSection && (
                                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                                  <h4 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-100">
                                    The Bottom Line
                                  </h4>
                                  <div className="space-y-4 text-gray-700 leading-relaxed">
                                    {bottomLineSection.split('\n\n').map((paragraph: string, pIndex: number) => (
                                      paragraph.trim() && (
                                        <p key={pIndex} className="text-gray-700">
                                          {paragraph.trim()}
                                        </p>
                                      )
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Side-by-Side Numbers */}
                              {sideBySideSection && (() => {
                                // Parse the pipe-separated table format
                                const lines = sideBySideSection.split('\n').filter((l: string) => l.includes('|'))
                                const headerLine = lines[0]
                                const dataLines = lines.slice(1)

                                // Extract plan names from header (e.g., "Category | Plan A | Plan B")
                                const headers = headerLine ? headerLine.split('|').map((h: string) => h.trim()) : []
                                const planNames = headers.slice(1) // Skip "Category"

                                return (
                                  <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                                    <h4 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-100">
                                      Side-by-Side Numbers
                                    </h4>
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm">
                                        <thead>
                                          <tr className="border-b-2 border-gray-300">
                                            <th className="text-left py-2 pr-4 font-semibold text-gray-600"></th>
                                            {planNames.map((name: string, i: number) => (
                                              <th key={i} className="text-left py-2 px-4 font-bold text-gray-900">
                                                {name}
                                              </th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {dataLines.map((line: string, rowIndex: number) => {
                                            const cells = line.split('|').map((c: string) => c.trim())
                                            const category = cells[0]
                                            const values = cells.slice(1)
                                            return (
                                              <tr key={rowIndex} className="border-b border-gray-200">
                                                <td className="py-2 pr-4 font-medium text-gray-700">{category}</td>
                                                {values.map((value: string, colIndex: number) => (
                                                  <td key={colIndex} className="py-2 px-4 text-gray-900">
                                                    {value}
                                                  </td>
                                                ))}
                                              </tr>
                                            )
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )
                              })()}

                              {/* Plan Details Cards */}
                              {planCards.length > 0 && (
                                <div className="space-y-6">
                                  <h4 className="text-xl font-bold text-gray-900">Plan Details</h4>
                                  {planCards.map((card, index) => {
                                    const lines = card.content.split('\n').filter((l: string) => l.trim())
                                    const bestFor = lines.find((l: string) => l.toLowerCase().startsWith('best for'))
                                    const chooseIfStart = lines.findIndex((l: string) => l.includes('CHOOSE THIS PLAN IF'))
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
                                              (l.includes('$') || l.includes('Not listed')) && !l.includes('CHOOSE') && !l.includes('WATCH')
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
                                                <h6 className="font-semibold text-green-800 mb-2">Choose This Plan If</h6>
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
                                                <h6 className="font-semibold text-red-800 mb-2">Watch Out For</h6>
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

                          // Real-World Scenario needs special handling - capture everything from header to end
                          // because it contains multiple paragraphs separated by \n\n
                          const realWorldStart = analysisText.indexOf('REAL-WORLD SCENARIO')
                          const realWorldSection = realWorldStart !== -1
                            ? analysisText.substring(realWorldStart)
                            : null

                          const orderedSections = [whatsGoodSection, watchOutSection, planOverviewSection, realWorldSection].filter(Boolean)
                          
                          return orderedSections.map((section: string, index: number) => {
                            // What's Good section
                            if (section.startsWith("WHAT'S GOOD ABOUT THIS PLAN")) {
                              return (
                                <div key={index} className="bg-gray-50 border border-gray-300 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                                  <h4 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-100">
                                    What's Good About This Plan
                                  </h4>
                                  <div className="space-y-3">
                                    {section.replace("WHAT'S GOOD ABOUT THIS PLAN\n", '').split('\n').map((line: string, lineIndex: number) => (
                                      line.trim() && (
                                        <div key={lineIndex} className="text-gray-700 leading-relaxed flex items-start">
                                          <span className="text-gray-400 mr-3 mt-1 font-bold">•</span>
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
                                <div key={index} className="bg-gray-50 border border-gray-300 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                                  <h4 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-100">
                                    What to Watch Out For
                                  </h4>
                                  <div className="space-y-3">
                                    {section.replace('WHAT TO WATCH OUT FOR\n', '').split('\n').map((line: string, lineIndex: number) => (
                                      line.trim() && (
                                        <div key={lineIndex} className="text-gray-700 leading-relaxed flex items-start">
                                          <span className="text-gray-400 mr-3 mt-1 font-bold">•</span>
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
                                <div key={index} className="bg-gray-50 border border-gray-300 rounded-xl p-6 shadow-lg">
                                  <h4 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-100">
                                    Plan Details
                                  </h4>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                      <tbody>
                                        {overviewLines.map((line: string, lineIndex: number) => {
                                          const [label, ...rest] = line.split(':')
                                          const value = rest.join(':').trim()
                                          const labelWithDef = labelDefinitions[label.trim()] || label.trim()
                                          return (
                                            <tr key={lineIndex} className="border-b border-gray-200">
                                              <td className="py-2 pr-4 font-medium text-gray-700">{labelWithDef}</td>
                                              <td className="py-2 px-4 text-gray-900">{value}</td>
                                            </tr>
                                          )
                                        })}
                                      </tbody>
                                    </table>
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