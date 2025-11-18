'use client'

import { useState } from 'react'
import FileUpload from './components/FileUpload'
import URLInput from './components/URLInput'
import PrivacyNotice from './components/PrivacyNotice'
import UploadHistory from './components/UploadHistory'

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [urls, setUrls] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState<any>(null)

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files])
  }

  const handleUrlAdd = (url: string) => {
    setUrls(prev => [...prev, url])
  }

  const handleUpload = async () => {
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
      // Prepare form data
      const formData = new FormData()
      
      // Add files
      uploadedFiles.forEach(file => {
        formData.append('files', file)
      })
      
      // Add URLs
      formData.append('urls', JSON.stringify(urls))
      
      // Call upload API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          errorMessage = `Server error: ${response.status} - ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const result = await response.json()
      setUploadResults(result)
      
    } catch (error) {
      console.error('Upload failed:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const canUpload = uploadedFiles.length > 0 || urls.length > 0

  return (
    <div className="min-h-screen bg-beige-100">
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
            
            <PrivacyNotice />
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <FileUpload onFileUpload={handleFileUpload} />
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
                {isUploading ? 'Uploading...' : 'Upload Documents'}
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
              </div>
            </div>
          </div>
        )}

        {/* Upload History */}
        <UploadHistory />

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
    </div>
  )
}