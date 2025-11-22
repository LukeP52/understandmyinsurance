import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { getDownloadURL, ref } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { detectPlanType, getBenchmarkRating } from '@/lib/benchmarks'

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
You are an expert health-insurance translator for normal people. 
Extract key details from this insurance PDF and explain them in plain English using the format below.

**Plan Name & Type**
Start with the plan name, carrier, and plan type (HMO/PPO/EPO) from the PDF.

**The 8 Things That Matter Most**
Explain these categories first (based on what 75%+ of people actually care about):

1. **Monthly Premium** (what you pay every month just to have insurance)
   • Single: $[amount] | Family: $[amount] (+ employer contribution if mentioned)

2. **Total Out-of-Pocket Risk** (deductible + out-of-pocket max)
   • Deductible: $[amount] single / $[amount] family
   • Out-of-pocket maximum: $[amount] single / $[amount] family
   • Doctor visits [do/don't] count toward deductible

3. **Doctor/Hospital Network** (can you keep your doctors?)
   • Network type: [HMO/PPO/EPO] 
   • Network name: [actual network name]
   • Key network highlights: [mention major hospital systems if listed]

4. **Prescription Costs**
   • Generic: $[amount] copay
   • Brand name: $[amount] or [%] coinsurance  
   • Specialty drugs: [%] coinsurance

5. **Doctor Visit Copays**
   • Primary care: $[amount]
   • Specialist: $[amount]
   • Referrals: [Required/Not required]

6. **Emergency Room Costs**
   • ER copay: $[amount] (waived if admitted: [yes/no])

7. **Kids Dental & Vision** (under 19 - always included)
   • [Brief summary of pediatric coverage]

8. **Adult Dental & Vision** 
   • [Usually "Separate policy needed" or brief summary if bundled]

**What's Good About This Plan**
• [4-6 actual benefits from the PDF]
• [Focus on standout features, low costs, broad networks, etc.]

**What to Watch Out For**
• [4-6 actual limitations from the PDF]  
• [High deductibles, narrow networks, excluded services, etc.]

**Detailed Plan Info**
Get into the specifics for people who want to dig deeper:

**How the Money Works**
• 100% Free: [services with no cost/deductible]
• Fixed Copays: [services with flat fees regardless of deductible]  
• After Deductible: [coinsurance percentages you pay]

**Coverage Details**
• [Specific benefits, exclusions, and coverage rules]
• [Prior authorization requirements]
• [Geographic restrictions]

**Network Rules**
• [In-network vs out-of-network details]
• [Referral requirements]
• [Emergency care rules]

Extract actual dollar amounts and percentages from the PDF. Be honest about costs and limitations. Keep total response under 600 words.
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
Plan Type: Plan A: [Type] | Plan B: [Type] ${fileData.length > 2 ? '| Plan C: [Type]' : ''} ${fileData.length > 3 ? '| Plan D: [Type]' : ''}
Out-of-Pocket Max: Plan A: $X | Plan B: $X ${fileData.length > 2 ? '| Plan C: $X' : ''} ${fileData.length > 3 ? '| Plan D: $X' : ''}
Primary Care Copay: Plan A: $X | Plan B: $X ${fileData.length > 2 ? '| Plan C: $X' : ''} ${fileData.length > 3 ? '| Plan D: $X' : ''}
Specialist Copay: Plan A: $X | Plan B: $X ${fileData.length > 2 ? '| Plan C: $X' : ''} ${fileData.length > 3 ? '| Plan D: $X' : ''}

DETAILED COMPARISON
Cost Winner: [Which plan has the lowest overall costs and why]
Coverage Winner: [Which plan has the best coverage and why]
Network Winner: [Which plan has the best network of doctors/hospitals]

PROS AND CONS
Plan A Pros: • [Pro 1] • [Pro 2] • [Pro 3]
Plan A Cons: • [Con 1] • [Con 2] • [Con 3]

Plan B Pros: • [Pro 1] • [Pro 2] • [Pro 3]  
Plan B Cons: • [Con 1] • [Con 2] • [Con 3]

${fileData.length > 2 ? `Plan C Pros: • [Pro 1] • [Pro 2] • [Pro 3]\nPlan C Cons: • [Con 1] • [Con 2] • [Con 3]` : ''}

BOTTOM LINE RECOMMENDATION
[Clear recommendation of which plan is best for different types of people - young/healthy, families, frequent doctor visits, etc.]

Explain all insurance terms clearly. Do NOT use asterisks (*) anywhere - only bullet points (•).
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