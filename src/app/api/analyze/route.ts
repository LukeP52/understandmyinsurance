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
Turn any health insurance PDF into a short, honest, easy-to-read summary using ONLY the exact format below.

CRITICAL: Extract ACTUAL values from the PDF and replace ALL bracketed placeholders with real data.

FIRST: Detect the plan type (this decides which benchmarks to use)
- Medicare Advantage → look for "Medicare Advantage", "Part C", "SilverSneakers", "star rating", "MOOP"
- Large Employer / ASO → premium <$200 single OR mentions "large group", "national network", "BlueCard", "ASO"  
- Small Group → mentions "small group", "2–50 employees", "SHOP"
- Otherwise → Individual / ACA Marketplace

THEN: Extract actual data and apply the correct ▲ ratings using benchmarks below.

OUTPUT EXACTLY THIS STRUCTURE (replace ALL [brackets] with real values from the PDF):

**2026 [ACTUAL Plan Name] – [ACTUAL Carrier] [ACTUAL Plan Type/Metal Level]**

⚡ How this plan scores on the 10 things 90%+ of people actually care about

| # | What matters most                  | This plan                                      | Quick verdict          |
|---|------------------------------------|------------------------------------------------|-------------------------|
| 1 | Monthly premium                    | $[ACTUAL premium] single / $[ACTUAL] family   | [▲ rating based on amount] |
| 2 | Total out-of-pocket risk           | Deductible $[ACTUAL]/$[ACTUAL] + OOP max $[ACTUAL]/$[ACTUAL] | [▲ rating] |
| 3 | Doctor/hospital network            | [ACTUAL network type] – [ACTUAL network name] | [▲ rating] |
| 4 | Prescription costs                 | Generic $[ACTUAL], specialty [ACTUAL]% etc.   | [▲ rating] |
| 5 | Out-of-pocket maximum (single)     | $[ACTUAL amount from PDF]                     | [▲ rating] |
| 6 | Doctor visit copays                | Primary $[ACTUAL] / Specialist $[ACTUAL]      | [▲ rating] |
| 7 | Referral rules                     | [ACTUAL: No referral needed OR Referral required] | [▲ rating] |
| 8 | ER cost                            | $[ACTUAL] copay [waived if admitted or not]   | [▲ rating] |
| 9 | Kids dental & vision (under 19)    | [ACTUAL coverage details from PDF]            | [▲ rating] |
|10 | Adult dental & vision              | [ACTUAL coverage details from PDF]            | [▲ rating] |

⚡ At-a-Glance

**Monthly Premium** (what you pay every month to have insurance)  
$[ACTUAL single amount] single / $[ACTUAL family amount] family [+ any employer contribution details]

**Deductible** (amount you pay 100% before insurance helps on most services)  
$[ACTUAL] single | $[ACTUAL] family  
→ Doctor visits & preventive care [do OR do not] count toward this

**Out-of-Pocket Maximum** (your "I'm done paying" cap for the year)  
$[ACTUAL] single | $[ACTUAL] family

**Doctor Visits**  
Primary care: $[ACTUAL] copay (flat fee) · Specialist: $[ACTUAL] copay · [ACTUAL referral requirement]

**Prescriptions** [ACTUAL summary of prescription coverage tiers and costs]

**Emergency Room** $[ACTUAL] copay [ACTUAL info about waiver if admitted]

**Kids Dental & Vision** [ACTUAL summary of pediatric coverage]

**Adult Dental & Vision** [ACTUAL summary of adult coverage]

**Best Parts** [4–6 bullets of ACTUAL plan benefits from PDF]
• [ACTUAL benefit 1]
• [ACTUAL benefit 2]
• [ACTUAL benefit 3]
• [ACTUAL benefit 4]

**Biggest Gotchas** [4–6 bullets of ACTUAL limitations/exclusions from PDF]
• [ACTUAL limitation 1]
• [ACTUAL limitation 2]
• [ACTUAL limitation 3]
• [ACTUAL limitation 4]

📋 A Little More Detail

**How the Money Works** [ACTUAL step-by-step breakdown from PDF]  
**100% Free** [ACTUAL services with no cost/deductible]  
**Fixed Copays** [ACTUAL services with copays that don't require meeting deductible]  
**After Deductible** [ACTUAL coinsurance percentages]  
**Major Exclusions** [ACTUAL exclusions from PDF]  
**Network Rules** [ACTUAL network restrictions from PDF]

Keep total summary under 600 words. Be friendly, direct, and brutally concise.

BENCHMARK SCORING (use these to assign ▲ ratings):

For Individual/ACA plans:
- Monthly premium: ▲▲▲▲▲ ≤$400 | ▲▲▲▲□ $401-500 | ▲▲▲□□ $501-600 | ▲▲□□□ $601-700 | ▲□□□□ ≥$701
- OOP max: ▲▲▲▲▲ ≤$7k | ▲▲▲▲□ $7-8.5k | ▲▲▲□□ $8.5-9.45k | ▲▲□□□ $9.45k+ 
- Doctor visits: ▲▲▲▲▲ ≤$25 prim/≤$50 spec | ▲▲▲▲□ ≤$35/≤$70 | ▲▲▲□□ ≤$50/≤$100 | ▲▲□□□ after deductible | ▲□□□□ full cost until deductible
- ER cost: ▲▲▲▲▲ ≤$300 | ▲▲▲▲□ $301-500 | ▲▲▲□□ $501-750 | ▲▲□□□ >$750 | ▲□□□□ after deductible
- Referrals: ▲▲▲▲▲ no referral | ▲□□□□ referral required
- Network: ▲▲▲▲▲ broad national PPO | ▲▲▲▲□ large regional | ▲▲▲□□ medium regional | ▲▲□□□ narrow | ▲□□□□ very narrow
- Rx costs: ▲▲▲▲▲ generic ≤$10, specialty ≤25% | ▲▲▲▲□ ≤$15, ≤30% | ▲▲▲□□ $15-25, 30-40% | ▲▲□□□ high tier copays | ▲□□□□ 40-50% specialty
- Kids dental/vision: ▲▲▲▲▲ 100% preventive + basic | ▲▲▲▲□ preventive only | ▲▲▲□□ limited | ▲□□□□ none
- Adult dental/vision: ▲▲▲▲▲ bundled/rich rider | ▲▲▲▲□ limited rider | ▲▲▲□□ separate policy needed | ▲□□□□ none

Adjust thresholds for other plan types: Large Employer plans generally have better thresholds, Medicare Advantage uses different scales.

REMEMBER: NO brackets should remain in your output - replace ALL with actual data from the PDF.
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