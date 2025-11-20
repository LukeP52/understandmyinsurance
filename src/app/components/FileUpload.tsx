'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface FileUploadProps {
  onFileUpload: (files: File[]) => void
  onAuthRequired: () => void
}

export default function FileUpload({ onFileUpload, onAuthRequired }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (!user) {
      onAuthRequired()
      return
    }
    
    const files = Array.from(e.dataTransfer.files).filter(file => {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png'
      ]
      
      // File type validation
      if (!validTypes.includes(file.type)) {
        alert(`File type not supported: ${file.name}`)
        return false
      }
      
      // File size validation (5MB limit)
      const maxSizeMB = 5
      const maxSizeBytes = maxSizeMB * 1024 * 1024
      if (file.size > maxSizeBytes) {
        alert(`File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum ${maxSizeMB}MB allowed.`)
        return false
      }
      
      return true
    })
    
    if (files.length > 0) {
      onFileUpload(files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      onAuthRequired()
      return
    }
    
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFileUpload(files)
    }
  }

  const openFileDialog = () => {
    if (!user) {
      onAuthRequired()
      return
    }
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-black">Upload Documents</h3>
      
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-black bg-beige-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div className="space-y-4">
          <div className="text-4xl">📄</div>
          <div>
            <p className="text-lg font-medium text-black">Drop files here or click to browse</p>
            <p className="text-sm text-gray-600 mt-2">
              Supports PDF, Word docs, images, and text files
            </p>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
      />

      <div className="space-y-2">
        <div className="text-xs text-gray-500">
          <strong>Accepted formats:</strong> PDF, Word (.doc/.docx), Text (.txt), Images (.jpg/.png)
        </div>
        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
          <strong>Privacy reminder:</strong> Only upload generic plan documents. No EOBs, bills, or personal medical records.
        </div>
      </div>
    </div>
  )
}