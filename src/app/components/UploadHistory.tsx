'use client'

import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

interface Document {
  id: string
  urls: string[]
  fileCount: number
  urlCount: number
  uploadedAt: any
  status: string
  file?: {
    fileName: string
    fileSize: number
    downloadURL: string
  }
}

export default function UploadHistory() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setLoading(false)
      setDocuments([])
      return
    }

    // Real-time listener for user's documents
    const q = query(
      collection(db, 'documents'), 
      where('userId', '==', user.uid)
    )
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs: Document[] = []
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() } as Document)
      })
      
      // Sort by uploadedAt on client-side and limit to 10
      docs.sort((a, b) => {
        if (!a.uploadedAt || !b.uploadedAt) return 0;
        return b.uploadedAt.toDate() - a.uploadedAt.toDate();
      });
      
      setDocuments(docs.slice(0, 10))
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mb-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-black mb-6">Upload History</h2>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your documents...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto mb-12">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-black mb-6">Upload History</h2>
        
        {!user ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Please sign in to view your upload history.</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        doc.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {doc.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {doc.uploadedAt?.toDate?.()?.toLocaleString() || 'Just now'}
                      </span>
                    </div>
                    
                    {doc.file && (
                      <div className="mb-2">
                        <p className="text-sm font-medium">📄 {doc.file.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {(doc.file.fileSize / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    )}
                    
                    {doc.urls.length > 0 && (
                      <div className="mb-2">
                        <p className="text-sm font-medium">🔗 URLs:</p>
                        {doc.urls.map((url, index) => (
                          <p key={index} className="text-xs text-blue-600 truncate">
                            {url}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {doc.fileCount} files • {doc.urlCount} URLs
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}