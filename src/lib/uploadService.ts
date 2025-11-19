import { storage, db } from './firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore'

interface UploadResult {
  id: string
  fileUrl?: string
  fileName: string
  fileSize: number
  fileType: string
  urls: string[]
  uploadedAt: any
}

export async function uploadDocuments(
  files: File[], 
  urls: string[],
  userId: string
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

  // Upload files to Firebase Storage
  if (files.length > 0) {
    const file = files[0] // For now, handle single file
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
    await addDoc(collection(db, 'documents'), {
      ...docData,
      file: uploadedFileData,
      status: 'completed'
    })
  }

  return {
    id: docRef.id,
    fileUrl: uploadedFileData?.downloadURL,
    fileName: uploadedFileData?.fileName || '',
    fileSize: uploadedFileData?.fileSize || 0,
    fileType: uploadedFileData?.fileType || '',
    urls: urls,
    uploadedAt: docData.uploadedAt
  }
}

export async function getUploadHistory(userId: string) {
  try {
    const q = query(
      collection(db, 'documents'),
      where('userId', '==', userId),
      where('status', '==', 'completed'),
      orderBy('uploadedAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    return documents
  } catch (error) {
    console.error('Error fetching upload history:', error)
    return []
  }
}