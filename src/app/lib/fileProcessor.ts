import * as pdfParse from 'pdf-parse'
import * as mammoth from 'mammoth'
import * as cheerio from 'cheerio'

export interface ProcessedFile {
  filename: string
  content: string
  type: string
  size: number
}

export async function processFile(file: File): Promise<ProcessedFile> {
  const filename = file.name
  const type = file.type
  const size = file.size
  
  let content: string

  try {
    if (type === 'application/pdf') {
      content = await processPDF(file)
    } else if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      content = await processWordDoc(file)
    } else if (type === 'application/msword') {
      content = await processWordDoc(file)
    } else if (type === 'text/plain') {
      content = await processTextFile(file)
    } else if (type.startsWith('image/')) {
      content = `[IMAGE FILE: ${filename} - Image content analysis not yet implemented]`
    } else {
      throw new Error(`Unsupported file type: ${type}`)
    }

    return {
      filename,
      content: content || '[No text content found]',
      type,
      size
    }
  } catch (error) {
    console.error(`Error processing file ${filename}:`, error)
    throw new Error(`Failed to process ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function processPDF(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const data = await (pdfParse as any).default(Buffer.from(buffer))
  return data.text
}

async function processWordDoc(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
  return result.value
}

async function processTextFile(file: File): Promise<string> {
  return await file.text()
}

export async function scrapeURL(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; InsuranceAnalyzer/1.0)'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Remove script and style elements
    $('script, style, nav, header, footer, aside').remove()

    // Extract main content
    let content = ''
    
    // Try to find main content areas
    const contentSelectors = [
      'main',
      '.content',
      '.main-content',
      '#content',
      '.post-content',
      '.entry-content',
      'article',
      '.plan-details',
      '.benefits',
      '.coverage'
    ]

    for (const selector of contentSelectors) {
      const element = $(selector)
      if (element.length && element.text().trim().length > content.length) {
        content = element.text().trim()
      }
    }

    // Fallback to body if no main content found
    if (!content) {
      content = $('body').text().trim()
    }

    // Clean up whitespace
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim()

    if (!content) {
      throw new Error('No text content found on the page')
    }

    return content
  } catch (error) {
    console.error(`Error scraping URL ${url}:`, error)
    throw new Error(`Failed to scrape ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}