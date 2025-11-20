'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { uploadDocuments } from '@/lib/uploadService'
import FileUpload from './components/FileUpload'
import URLInput from './components/URLInput'
import PrivacyNotice from './components/PrivacyNotice'
import AuthModal from './components/Auth/AuthModal'

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [urls, setUrls] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadResults, setUploadResults] = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [geminiTest, setGeminiTest] = useState<any>(null)
  const [testingGemini, setTestingGemini] = useState(false)
  const { user, signOut } = useAuth()

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files])
  }

  const handleUrlAdd = (url: string) => {
    setUrls(prev => [...prev, url])
  }

  const handleUpload = async () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    // Validate file count before processing
    const totalItems = uploadedFiles.length + urls.length
    if (totalItems > 3) {
      alert(`Too many items (${totalItems}). Maximum 3 files/URLs per upload.`)
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

      const result = await uploadDocuments(uploadedFiles, urls, user.uid)
      
      setUploadResults({
        success: true,
        data: {
          id: result.id,
          files: uploadedFiles.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type
          })),
          urls: urls,
          totalItems: uploadedFiles.length + urls.length,
          timestamp: new Date().toISOString(),
          analysis: result.analysis
        }
      })

      // Clear the form
      setUploadedFiles([])
      setUrls([])
      
    } catch (error) {
      console.error('Upload failed:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
      setIsAnalyzing(false)
    }
  }

  const canUpload = uploadedFiles.length > 0 || urls.length > 0

  const testGemini = async () => {
    setTestingGemini(true)
    setGeminiTest(null)
    
    try {
      const response = await fetch('/api/test-gemini')
      const result = await response.json()
      setGeminiTest(result)
    } catch (error) {
      setGeminiTest({
        success: false,
        error: 'Failed to connect to test endpoint',
        details: error instanceof Error ? error.message : 'Network error'
      })
    } finally {
      setTestingGemini(false)
    }
  }

  return (
    <div className="min-h-screen bg-beige-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Understand My Insurance</h1>
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
            <h2 className="text-2xl font-bold text-black mb-6">Upload Your Insurance Documents</h2>
            
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-2xl">🤖</div>
                  <div>
                    <h3 className="font-semibold text-blue-800 mb-1">AI-Powered Analysis</h3>
                    <p className="text-sm text-blue-700">
                      PDF insurance documents will be automatically analyzed by AI and explained in plain English. 
                      No confusing insurance jargon - just simple explanations of what your plan covers, what you pay, 
                      and what to watch out for.
                    </p>
                  </div>
                </div>
                <button
                  onClick={testGemini}
                  disabled={testingGemini}
                  className="ml-4 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex-shrink-0"
                >
                  {testingGemini ? 'Testing...' : 'Test AI'}
                </button>
              </div>
              
              {/* Gemini Test Results */}
              {geminiTest && (
                <div className={`mt-4 p-3 rounded text-xs border ${
                  geminiTest.success 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {geminiTest.success ? (
                    <div>
                      <div className="font-medium mb-1">✅ Gemini AI Connected Successfully!</div>
                      <div className="italic">"{geminiTest.response}"</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium mb-1">❌ {geminiTest.error}</div>
                      {geminiTest.details && <div className="text-xs opacity-75">{geminiTest.details}</div>}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <PrivacyNotice />
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <FileUpload onFileUpload={handleFileUpload} onAuthRequired={() => setShowAuthModal(true)} />
              <URLInput onUrlAdd={handleUrlAdd} />
            </div>

            {/* Uploaded Items Summary */}
            {(uploadedFiles.length > 0 || urls.length > 0) && (
              <div className="mb-6 p-4 bg-beige-50 rounded-lg">
                <h3 className="font-semibold text-black mb-2">Ready to Upload:</h3>
                <div className="space-y-1 text-sm text-gray-700">
                  {uploadedFiles.map((file, index) => (
                    <div key={index}>📄 {file.name}</div>
                  ))}
                  {urls.map((url, index) => (
                    <div key={index}>🔗 {url}</div>
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
                {isAnalyzing ? 'Analyzing PDF...' : isUploading ? 'Uploading...' : 'Upload Documents'}
              </button>
            </div>
          </div>
        </div>

        {/* Upload Results Section */}
        {uploadResults && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-black mb-6">Upload Successful ✅</h2>
              
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="font-semibold text-green-800 mb-4">Files and URLs processed successfully</h3>
                  
                  {uploadResults.data.files.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-green-700 mb-2">Files uploaded:</h4>
                      <ul className="text-green-600 space-y-1">
                        {uploadResults.data.files.map((file: any, index: number) => (
                          <li key={index}>
                            📄 {file.name} ({(file.size / 1024).toFixed(0)} KB)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {uploadResults.data.urls.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-green-700 mb-2">URLs added:</h4>
                      <ul className="text-green-600 space-y-1">
                        {uploadResults.data.urls.map((url: string, index: number) => (
                          <li key={index}>🔗 {url}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="text-sm text-green-600 mt-4">
                    Total items: {uploadResults.data.totalItems} • 
                    Uploaded: {uploadResults.data.timestamp ? new Date(uploadResults.data.timestamp).toLocaleString() : 'now'}
                  </div>
                </div>

                {/* AI Analysis Results */}
                {uploadResults.data.analysis && (
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-semibold text-blue-800 mb-4 flex items-center">
                      🤖 Your Insurance Plan Explained
                      <span className="ml-2 text-xs text-blue-600 font-normal">
                        Analyzed: {new Date(uploadResults.data.analysis.analyzedAt).toLocaleString()}
                      </span>
                    </h3>
                    <div className="text-blue-900">
                      {uploadResults.data.analysis.text.split('\n\n').map((section: string, index: number) => {
                        // Check if this is the QUICK OVERVIEW section
                        if (section.startsWith('QUICK OVERVIEW')) {
                          return (
                            <div key={index} className="mb-6 p-4 bg-white border border-blue-300 rounded-lg">
                              <h4 className="font-bold text-blue-800 text-lg mb-3">📋 Quick Overview</h4>
                              <div className="text-sm text-blue-900 font-medium space-y-1">
                                {section.replace('QUICK OVERVIEW\n', '').split('\n').map((line: string, lineIndex: number) => (
                                  <div key={lineIndex}>{line}</div>
                                ))}
                              </div>
                            </div>
                          )
                        }
                        
                        // Handle other sections
                        if (section.trim()) {
                          const lines = section.split('\n')
                          const title = lines[0]
                          const content = lines.slice(1).join('\n')
                          
                          // Check if this line looks like a section header (all caps or starts with specific patterns)
                          const isHeader = title.match(/^[A-Z\s]+$/) || title.startsWith('DOCUMENT') || title.startsWith('WHAT') || title.startsWith('NETWORK') || title.startsWith('IMPORTANT') || title.startsWith('KEY')
                          
                          if (isHeader) {
                            return (
                              <div key={index} className="mb-4">
                                <h4 className="font-bold text-blue-800 text-base mb-2 border-b border-blue-300 pb-1">
                                  {title}
                                </h4>
                                <div className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">
                                  {content}
                                </div>
                              </div>
                            )
                          }
                          
                          return (
                            <div key={index} className="mb-4 text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">
                              {section}
                            </div>
                          )
                        }
                        return null
                      })}
                    </div>
                  </div>
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