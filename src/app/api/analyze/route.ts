import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { getDownloadURL, ref } from 'firebase/storage'
import { storage } from '@/lib/firebase'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables')
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please contact support.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { fileUrl, fileName, userId, files, mode = 'single' } = body

    if (mode === 'single') {
      if (!fileUrl || !fileName || !userId) {
        return NextResponse.json(
          { error: 'Missing required fields: fileUrl, fileName, userId' },
          { status: 400 }
        )
      }
      console.log('Starting single analysis for file:', fileName)
    } else {
      if (!files || !userId || !Array.isArray(files)) {
        return NextResponse.json(
          { error: 'Missing required fields for comparison: files, userId' },
          { status: 400 }
        )
      }
      console.log('Starting comparison analysis for', files.length, 'files')
    }

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    let analysisText

    if (mode === 'single') {
      // Single file analysis
      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch file from storage')
      }

      const arrayBuffer = await response.arrayBuffer()
      const base64Data = Buffer.from(arrayBuffer).toString('base64')

      const singlePrompt = `
Analyze this insurance document and provide a clear explanation in plain English.

Please provide your response in this EXACT format with ONLY these 4 sections:

WHAT'S GOOD ABOUT THIS PLAN
• This plan would be good for you if [describe ideal user situation - max 40 words]
• [Coverage benefits - max 40 words] 
• [Cost advantages - max 40 words]
• [Network or convenience benefits - max 40 words]

WHAT TO WATCH OUT FOR
• Avoid getting this plan if [describe who should not choose this plan - max 40 words]
• [High costs or deductible concerns - max 40 words]
• [Coverage limitations or exclusions - max 40 words]
• [Network restrictions or access issues - max 40 words]

PLAN OVERVIEW
Monthly Premium: $X
Annual Deductible: $X
Out-of-Pocket Maximum: $X
Plan Type: [HMO/PPO/etc.]
Network: [Insurance company name]
Primary Care Copay: $X
Specialist Copay: $X
Emergency Room Cost: $X
Urgent Care Cost: $X
Prescription Drug Coverage: [Formulary tier/coverage details]
Pediatric Dental & Vision: [Included/Not included for kids under 19]
Adult Dental & Vision: [Add-on options available/costs]

REAL-WORLD SCENARIO: HOW THIS PLAN WORKS
A real world care scenario with 4 to 6 bullets that does not use asterisks in the text that shows the key details of the plan in a real life scenario and have the last bullet be a summary of cost from the example.

IMPORTANT: Keep ALL sentences to 40 words or less. Use simple language and define insurance terms in parentheses. NEVER use asterisks (*) anywhere in your response. Use bullet points (•) for all sections. Each bullet point must cover a DIFFERENT topic - no repetition.
`

      const result = await model.generateContent([
        singlePrompt,
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Data
          }
        }
      ])

      analysisText = result.response.text()

    } else {
      // Multiple file comparison
      const fileData = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const response = await fetch(file.url)
        if (!response.ok) {
          throw new Error(`Failed to fetch file from storage: ${file.name}`)
        }
        
        const arrayBuffer = await response.arrayBuffer()
        const base64Data = Buffer.from(arrayBuffer).toString('base64')
        
        fileData.push({
          name: file.name,
          data: base64Data
        })
      }

      const comparePrompt = `
Compare these ${files.length} insurance plans and provide a comprehensive comparison. 

Please provide your response in this EXACT format:

PLAN RECOMMENDATIONS
Plan A (${fileData[0].name}): This plan would be good to choose if [specific scenarios when this plan is better - be specific about costs, coverage, or situations]

Plan B (${fileData[1].name}): This plan would be good to choose if [specific scenarios when this plan is better - be specific about costs, coverage, or situations]

${fileData.length > 2 ? `Plan C (${fileData[2].name}): This plan would be good to choose if [specific scenarios when this plan is better]` : ''}

${fileData.length > 3 ? `Plan D (${fileData[3].name}): This plan would be good to choose if [specific scenarios when this plan is better]` : ''}

SIDE-BY-SIDE OVERVIEW
Monthly Premium: Plan A: $X | Plan B: $X ${fileData.length > 2 ? '| Plan C: $X' : ''} ${fileData.length > 3 ? '| Plan D: $X' : ''}
Annual Deductible: Plan A: $X | Plan B: $X ${fileData.length > 2 ? '| Plan C: $X' : ''} ${fileData.length > 3 ? '| Plan D: $X' : ''}
Out-of-Pocket Max: Plan A: $X | Plan B: $X ${fileData.length > 2 ? '| Plan C: $X' : ''} ${fileData.length > 3 ? '| Plan D: $X' : ''}
Plan Type & Referrals: Plan A: [Type] | Plan B: [Type] ${fileData.length > 2 ? '| Plan C: [Type]' : ''} ${fileData.length > 3 ? '| Plan D: [Type]' : ''}
Network: Plan A: [Network] | Plan B: [Network] ${fileData.length > 2 ? '| Plan C: [Network]' : ''} ${fileData.length > 3 ? '| Plan D: [Network]' : ''}
Primary Care Copay: Plan A: $X | Plan B: $X ${fileData.length > 2 ? '| Plan C: $X' : ''} ${fileData.length > 3 ? '| Plan D: $X' : ''}
Specialist Copay: Plan A: $X | Plan B: $X ${fileData.length > 2 ? '| Plan C: $X' : ''} ${fileData.length > 3 ? '| Plan D: $X' : ''}
Emergency Room: Plan A: $X | Plan B: $X ${fileData.length > 2 ? '| Plan C: $X' : ''} ${fileData.length > 3 ? '| Plan D: $X' : ''}
Urgent Care: Plan A: $X | Plan B: $X ${fileData.length > 2 ? '| Plan C: $X' : ''} ${fileData.length > 3 ? '| Plan D: $X' : ''}
Prescription Coverage: Plan A: [Coverage] | Plan B: [Coverage] ${fileData.length > 2 ? '| Plan C: [Coverage]' : ''} ${fileData.length > 3 ? '| Plan D: [Coverage]' : ''}
Pediatric Dental/Vision: Plan A: [Y/N] | Plan B: [Y/N] ${fileData.length > 2 ? '| Plan C: [Y/N]' : ''} ${fileData.length > 3 ? '| Plan D: [Y/N]' : ''}
Adult Dental/Vision: Plan A: [Available/Cost] | Plan B: [Available/Cost] ${fileData.length > 2 ? '| Plan C: [Available/Cost]' : ''} ${fileData.length > 3 ? '| Plan D: [Available/Cost]' : ''}

DETAILED COMPARISON
Cost Winner: [Which plan has the lowest overall costs and why]
Coverage Winner: [Which plan has the best coverage and why]
Network Winner: [Which plan has the best network of doctors/hospitals]

PROS AND CONS
Plan A Pros: • [Coverage advantage] • [Cost benefit] • [Network/access benefit]
Plan A Cons: • [Cost concern] • [Coverage limitation] • [Access restriction]

Plan B Pros: • [Coverage advantage] • [Cost benefit] • [Network/access benefit]  
Plan B Cons: • [Cost concern] • [Coverage limitation] • [Access restriction]

${fileData.length > 2 ? `Plan C Pros: • [Coverage advantage] • [Cost benefit] • [Network/access benefit]\nPlan C Cons: • [Cost concern] • [Coverage limitation] • [Access restriction]` : ''}

BOTTOM LINE RECOMMENDATION
[Clear recommendation of which plan is best for different types of people - young/healthy, families, frequent doctor visits, etc.]

Explain all insurance terms clearly. NEVER use asterisks (*) anywhere - only bullet points (•). Each bullet point must cover a DIFFERENT topic - no repetition of the same concepts.
`

      // Send all files to Gemini for comparison
      const content: any[] = [comparePrompt]
      
      for (let i = 0; i < fileData.length; i++) {
        content.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: fileData[i].data
          }
        })
      }

      const result = await model.generateContent(content)
      analysisText = result.response.text()
    }

    return NextResponse.json({
      success: true,
      analysis: analysisText,
      fileName: fileName,
      analyzedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Analysis error:', error)
    
    // Handle specific API errors
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      
      if (error.message.includes('API_KEY') || error.message.includes('API key') || error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Invalid Gemini API key. Please check configuration.' },
          { status: 401 }
        )
      }
      if (error.message.includes('quota') || error.message.includes('429')) {
        return NextResponse.json(
          { error: 'API quota exceeded. Please try again later.' },
          { status: 429 }
        )
      }
      if (error.message.includes('404') || error.message.includes('model')) {
        return NextResponse.json(
          { error: 'Gemini model not available. Please try again later.' },
          { status: 503 }
        )
      }
      
      // Return specific error message for debugging
      return NextResponse.json(
        { 
          error: 'Analysis failed',
          details: error.message,
          type: error.constructor.name
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to analyze document. Please try again.' },
      { status: 500 }
    )
  }
}