import { storage, db } from './firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore'

interface UploadResult {
  id: string
  fileUrl?: string
  fileName: string
  fileSize: number
  fileType: string
  urls: string[]
  uploadedAt: any
  analysis?: {
    text: string
    analyzedAt: string
  }
}

export async function uploadDocuments(
  files: File[], 
  urls: string[],
  userId: string,
  analysisMode: 'single' | 'compare' = 'single'
): Promise<UploadResult> {
  
  // Create a document record first
  const docData = {
    userId: userId,
    urls: urls,
    fileCount: files.length,
    urlCount: urls.length,
    uploadedAt: serverTimestamp(),
    status: 'uploading'
  }

  // Add document to Firestore
  const docRef = await addDoc(collection(db, 'documents'), docData)
  
  let uploadedFileData = null

  let analysis = undefined

  // Upload files to Firebase Storage
  if (files.length > 0) {
    if (analysisMode === 'single') {
      // Handle single file analysis
      const file = files[0]
      const fileName = `${docRef.id}_${file.name}`
      const storageRef = ref(storage, `users/${userId}/${fileName}`)
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      uploadedFileData = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        storageRef: fileName,
        downloadURL: downloadURL
      }

      // Update document with file info
      await updateDoc(doc(db, 'documents', docRef.id), {
        file: uploadedFileData,
        status: 'completed'
      })

      // Trigger analysis for PDF files
      if (file.type === 'application/pdf') {
        try {
          const analysisResponse = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileUrl: downloadURL,
              fileName: file.name,
              userId: userId,
              mode: 'single'
            })
          })

          if (analysisResponse.ok) {
            const analysisResult = await analysisResponse.json()
            analysis = {
              text: analysisResult.analysis,
              analyzedAt: analysisResult.analyzedAt
            }
          }
        } catch (error) {
          console.error('Analysis failed:', error)
          // Continue without analysis - don't fail the upload
        }
      }
    } else {
      // Handle multiple file comparison
      const uploadedFiles = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileName = `${docRef.id}_${i}_${file.name}`
        const storageRef = ref(storage, `users/${userId}/${fileName}`)
        
        // Upload file
        const snapshot = await uploadBytes(storageRef, file)
        const downloadURL = await getDownloadURL(snapshot.ref)
        
        uploadedFiles.push({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          storageRef: fileName,
          downloadURL: downloadURL
        })
      }

      // Update document with all files info
      await updateDoc(doc(db, 'documents', docRef.id), {
        files: uploadedFiles,
        status: 'completed'
      })

      // Trigger comparison analysis
      try {
        const fileUrls = uploadedFiles.map(f => ({ url: f.downloadURL, name: f.fileName }))
        const analysisResponse = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            files: fileUrls,
            userId: userId,
            mode: 'compare'
          })
        })

        if (analysisResponse.ok) {
          const analysisResult = await analysisResponse.json()
          analysis = {
            text: analysisResult.analysis,
            analyzedAt: analysisResult.analyzedAt
          }
        }
      } catch (error) {
        console.error('Comparison analysis failed:', error)
        // Continue without analysis - don't fail the upload
      }

      // Set the first file as the primary for return data
      uploadedFileData = uploadedFiles[0]
    }
  }

  return {
    id: docRef.id,
    fileUrl: uploadedFileData?.downloadURL,
    fileName: uploadedFileData?.fileName || '',
    fileSize: uploadedFileData?.fileSize || 0,
    fileType: uploadedFileData?.fileType || '',
    urls: urls,
    uploadedAt: docData.uploadedAt,
    analysis: analysis
  }
}

