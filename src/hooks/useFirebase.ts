'use client'

import { useEffect, useState } from 'react'
import app from '@/lib/firebase'

export function useFirebase() {
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      // Firebase is initialized when the app is imported
      if (app) {
        setInitialized(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Firebase initialization failed')
      console.error('Firebase initialization error:', err)
    }
  }, [])

  return { initialized, error }
}