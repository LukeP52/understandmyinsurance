import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const urls = JSON.parse(formData.get('urls') as string || '[]') as string[]

    // Basic validation
    if (files.length + urls.length === 0) {
      return NextResponse.json(
        { error: 'No files or URLs provided' },
        { status: 400 }
      )
    }

    // Limit to 3 files/URLs total
    if (files.length + urls.length > 3) {
      return NextResponse.json(
        { error: 'Maximum 3 files/URLs allowed per upload' },
        { status: 400 }
      )
    }

    // Process files (basic validation only)
    const processedFiles = []
    
    for (const file of files) {
      // Size limit: 5MB
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum 5MB allowed.` },
          { status: 400 }
        )
      }

      processedFiles.push({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      })
    }

    // Return success response with file info
    return NextResponse.json({
      success: true,
      message: 'Files and URLs uploaded successfully',
      data: {
        files: processedFiles,
        urls: urls,
        totalItems: files.length + urls.length,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    
    return NextResponse.json(
      { 
        error: 'Upload failed. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// CORS support
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}