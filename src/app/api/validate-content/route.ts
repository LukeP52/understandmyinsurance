import { NextRequest, NextResponse } from 'next/server'
import { validateContent } from '@/app/lib/phiProtection'

export async function POST(request: NextRequest) {
  try {
    const { content, filename } = await request.json()
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }
    
    const validation = validateContent(content, filename)
    
    return NextResponse.json(validation)
  } catch (error) {
    console.error('Content validation error:', error)
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 500 }
    )
  }
}