'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db, storage } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject, getDownloadURL } from 'firebase/storage';

interface FileDocument {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadURL?: string;
  category?: string;
  uploadedAt: any;
  userId: string;
  urls?: string[];
}

export default function FileManager() {
  const [documents, setDocuments] = useState<FileDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'documents'),
      where('userId', '==', user.uid),
      where('status', '==', 'completed'),
      orderBy('uploadedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs: FileDocument[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.file) {
          docs.push({
            id: doc.id,
            fileName: data.file.fileName,
            fileSize: data.file.fileSize,
            fileType: data.file.fileType,
            downloadURL: data.file.downloadURL,
            category: data.category || 'uncategorized',
            uploadedAt: data.uploadedAt,
            userId: data.userId,
            urls: data.urls || []
          });
        }
      });
      setDocuments(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (document: FileDocument) => {
    if (!confirm(`Are you sure you want to delete "${document.fileName}"?`)) {
      return;
    }

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'documents', document.id));
      
      // Delete from Storage if it exists
      if (document.downloadURL) {
        const storageRef = ref(storage, `users/${user?.uid}/${document.id}_${document.fileName}`);
        await deleteObject(storageRef);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const handleCategoryUpdate = async (docId: string, newCategory: string) => {
    try {
      await updateDoc(doc(db, 'documents', docId), {
        category: newCategory
      });
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDownload = async (document: FileDocument) => {
    if (!document.downloadURL) return;
    
    try {
      const link = document.createElement('a');
      link.href = document.downloadURL;
      link.download = document.fileName;
      link.click();
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const categories = ['all', 'health', 'auto', 'home', 'life', 'other', 'uncategorized'];
  
  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    return timestamp.toDate?.()?.toLocaleDateString() || 'Unknown';
  };

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Please sign in to manage your files.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-4">File Manager</h1>
        
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* File List */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">
            {searchTerm || selectedCategory !== 'all' 
              ? 'No files match your search criteria.' 
              : 'No files uploaded yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((document) => (
                  <tr key={document.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">
                          {document.fileType.includes('pdf') ? '📄' : 
                           document.fileType.includes('image') ? '🖼️' : 
                           document.fileType.includes('word') ? '📝' : '📄'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {document.fileName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {document.fileType}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={document.category}
                        onChange={(e) => handleCategoryUpdate(document.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {categories.slice(1).map(category => (
                          <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatFileSize(document.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(document.uploadedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {document.downloadURL && (
                          <button
                            onClick={() => handleDownload(document)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Download
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(document)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-500 text-center">
        Total files: {filteredDocuments.length}
      </div>
    </div>
  );
}