import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'
import { getAuth, Auth } from 'firebase/auth'

// Your Firebase config will go here
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

let app: FirebaseApp
let db: Firestore
let storage: FirebaseStorage
let auth: Auth

if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
  // Initialize Firebase only on client side and when config is available
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  db = getFirestore(app)
  storage = getStorage(app)
  auth = getAuth(app)
}

export { db, storage, auth }
export default app