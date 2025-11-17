'use client'

import { useState } from 'react'
import FileUpload from './components/FileUpload'
import URLInput from './components/URLInput'
import AnalysisResults from './components/AnalysisResults'
import PrivacyNotice from './components/PrivacyNotice'

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [urls, setUrls] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files])
  }

  const handleUrlAdd = (url: string) => {
    setUrls(prev => [...prev, url])
  }

  const handleAnalyze = async () => {
    // Validate file count before processing
    const totalItems = uploadedFiles.length + urls.length
    if (totalItems > 3) {
      alert(`Too many items (${totalItems}). Maximum 3 files/URLs per analysis to control costs.`)
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
    
    setIsAnalyzing(true)
    
    try {
      // Prepare form data
      const formData = new FormData()
      
      // Add files
      uploadedFiles.forEach(file => {
        formData.append('files', file)
      })
      
      // Add URLs
      formData.append('urls', JSON.stringify(urls))
      
      // Call analysis API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }
      
      const analysis = await response.json()
      setAnalysisResults(analysis)
      
    } catch (error) {
      console.error('Analysis failed:', error)
      alert(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const canAnalyze = uploadedFiles.length > 0 || urls.length > 0

  return (
    <div className="min-h-screen bg-beige-100">
      <div className="container mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-black font-display text-black mb-6 tracking-tight">
            UNDERSTAND<br />MY INSURANCE
          </h1>
          <p className="text-lg md:text-xl text-gray-800 mb-8 max-w-3xl mx-auto leading-relaxed">
            Upload your insurance plan documents or links and get a clear, 
            plain-language summary of what you're covered for and what you need to know.
          </p>
        </div>

        {/* Upload Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-black mb-6">Add Your Insurance Plans</h2>
            
            <PrivacyNotice />
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <FileUpload onFileUpload={handleFileUpload} />
              <URLInput onUrlAdd={handleUrlAdd} />
            </div>

            {/* Uploaded Items Summary */}
            {(uploadedFiles.length > 0 || urls.length > 0) && (
              <div className="mb-6 p-4 bg-beige-50 rounded-lg">
                <h3 className="font-semibold text-black mb-2">Ready to Analyze:</h3>
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

            {/* Analyze Button */}
            <div className="text-center">
              <button
                onClick={handleAnalyze}
                disabled={!canAnalyze || isAnalyzing}
                className="bg-black hover:bg-gray-800 text-white font-bold px-8 py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze My Plans'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {analysisResults && (
          <AnalysisResults results={analysisResults} />
        )}

        {/* How It Works */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-black text-center mb-12">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Upload Your Plans</h3>
              <p className="text-gray-700">
                Upload PDFs, documents, or paste links to your insurance plan details.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-3">AI Analysis</h3>
              <p className="text-gray-700">
                Our AI reads through the complex language and extracts the key information.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Clear Summary</h3>
              <p className="text-gray-700">
                Get a plain-language summary of your coverage, costs, and important details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}