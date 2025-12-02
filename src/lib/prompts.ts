export type InsuranceType = 'health' | 'auto' | 'home' | 'life' | 'other'

interface PromptConfig {
  planOverviewFields: string
  scenarioInstructions: string
  compareFields: string
}

const insuranceConfigs: Record<InsuranceType, PromptConfig> = {
  health: {
    planOverviewFields: `Monthly Premium: [exact value from document, or "Not listed in document"]
Annual Deductible: [exact value from document, or "Not listed in document"]
Out-of-Pocket Maximum: [exact value from document, or "Not listed in document"]
Coinsurance: [exact value from document, or "Not listed in document"]
Plan Type: [exact value from document, or "Not listed in document"]
Network: [exact value from document, or "Not listed in document"]
Primary Care: [exact value from document, or "Not listed in document"]
Specialist: [exact value from document, or "Not listed in document"]
Emergency Room: [exact value from document, or "Not listed in document"]
Urgent Care: [exact value from document, or "Not listed in document"]
Prescription Drugs: [exact value from document, or "Not listed in document"]
Pediatric Dental & Vision: [exact value from document, or "Not listed in document"]
Adult Dental & Vision: [exact value from document, or "Not listed in document"]

For costs, include copays ($X), coinsurance (X%), or both (e.g., "$20 copay + 10% coinsurance") - whatever the plan specifies. Use "Not listed in document" only if a value truly isn't in the document.`,
    scenarioInstructions: `Create a realistic patient journey showing how costs accumulate, using ONLY values from this document.

Structure your scenario like this:
• Start with Sarah, who has already met $X of her $Y deductible (use the document's actual deductible amount)
• Show Sarah's primary care visit (use the document's actual copay)
• Show a procedure/test that applies to the deductible (use actual coinsurance if listed)
• Show Sarah's specialist visit (use actual specialist copay)
• Show a prescription (use actual drug tier costs)
• End with a SUMMARY totaling what Sarah paid

IMPORTANT: Only include steps where you have real numbers from the document. Skip any step where the cost isn't specified - don't write "not listed" in the middle of the scenario. If most costs are missing, write a shorter scenario using only what's available. NEVER invent or estimate dollar amounts.`,
    compareFields: `Category | Plan A | Plan B
Monthly Premium | [value or "Not listed"] | [value or "Not listed"]
Annual Deductible | [value or "Not listed"] | [value or "Not listed"]
Out-of-Pocket Maximum | [value or "Not listed"] | [value or "Not listed"]
Coinsurance | [value or "Not listed"] | [value or "Not listed"]
Plan Type | [value or "Not listed"] | [value or "Not listed"]
Network | [value or "Not listed"] | [value or "Not listed"]
Primary Care | [value or "Not listed"] | [value or "Not listed"]
Specialist | [value or "Not listed"] | [value or "Not listed"]
Emergency Room | [value or "Not listed"] | [value or "Not listed"]
Urgent Care | [value or "Not listed"] | [value or "Not listed"]
Prescription Drugs | [value or "Not listed"] | [value or "Not listed"]
Pediatric Dental & Vision | [value or "Not listed"] | [value or "Not listed"]
Adult Dental & Vision | [value or "Not listed"] | [value or "Not listed"]`
  },
  auto: {
    planOverviewFields: `Monthly Premium: [exact value from document, or "Not listed in document"]
Annual Premium: [exact value from document, or "Not listed in document"]
Deductible (Collision): [exact value from document, or "Not listed in document"]
Deductible (Comprehensive): [exact value from document, or "Not listed in document"]
Bodily Injury Liability: [exact value from document, or "Not listed in document"]
Property Damage Liability: [exact value from document, or "Not listed in document"]
Collision Coverage: [exact value from document, or "Not listed in document"]
Comprehensive Coverage: [exact value from document, or "Not listed in document"]
Uninsured Motorist: [exact value from document, or "Not listed in document"]
Medical Payments: [exact value from document, or "Not listed in document"]
Rental Car Coverage: [exact value from document, or "Not listed in document"]
Roadside Assistance: [exact value from document, or "Not listed in document"]
Gap Coverage: [exact value from document, or "Not listed in document"]

For coverage limits, use the format from the document (e.g., "$100,000/$300,000" for split limits or "$500,000 combined single limit"). Use "Not listed in document" only if a value truly isn't in the document.`,
    scenarioInstructions: `Create a realistic scenario showing how this auto insurance would work in practice, using ONLY values from this document.

Structure your scenario like this:
• Start with Mike, who has this auto insurance policy
• Show what happens if Mike has a minor fender bender (use actual collision deductible)
• Show what happens if Mike's car is broken into (use actual comprehensive deductible)
• Show what happens if Mike causes an accident injuring someone (use actual liability limits)
• Show what happens if Mike is hit by an uninsured driver (use actual uninsured motorist coverage)
• End with a SUMMARY explaining the key protections and out-of-pocket costs

IMPORTANT: Only include steps where you have real numbers from the document. Skip any step where the coverage isn't specified. NEVER invent or estimate dollar amounts.`,
    compareFields: `Category | Plan A | Plan B
Monthly Premium | [value or "Not listed"] | [value or "Not listed"]
Collision Deductible | [value or "Not listed"] | [value or "Not listed"]
Comprehensive Deductible | [value or "Not listed"] | [value or "Not listed"]
Bodily Injury Liability | [value or "Not listed"] | [value or "Not listed"]
Property Damage Liability | [value or "Not listed"] | [value or "Not listed"]
Collision Coverage | [value or "Not listed"] | [value or "Not listed"]
Comprehensive Coverage | [value or "Not listed"] | [value or "Not listed"]
Uninsured Motorist | [value or "Not listed"] | [value or "Not listed"]
Medical Payments | [value or "Not listed"] | [value or "Not listed"]
Rental Car Coverage | [value or "Not listed"] | [value or "Not listed"]
Roadside Assistance | [value or "Not listed"] | [value or "Not listed"]
Gap Coverage | [value or "Not listed"] | [value or "Not listed"]`
  },
  home: {
    planOverviewFields: `Annual Premium: [exact value from document, or "Not listed in document"]
Deductible: [exact value from document, or "Not listed in document"]
Dwelling Coverage (Coverage A): [exact value from document, or "Not listed in document"]
Other Structures (Coverage B): [exact value from document, or "Not listed in document"]
Personal Property (Coverage C): [exact value from document, or "Not listed in document"]
Loss of Use (Coverage D): [exact value from document, or "Not listed in document"]
Personal Liability (Coverage E): [exact value from document, or "Not listed in document"]
Medical Payments (Coverage F): [exact value from document, or "Not listed in document"]
Water Damage Coverage: [exact value from document, or "Not listed in document"]
Hurricane/Wind Deductible: [exact value from document, or "Not listed in document"]
Flood Coverage: [exact value from document, or "Not listed in document"]
Earthquake Coverage: [exact value from document, or "Not listed in document"]
Replacement Cost vs Actual Cash Value: [exact value from document, or "Not listed in document"]

Use "Not listed in document" only if a value truly isn't in the document.`,
    scenarioInstructions: `Create a realistic scenario showing how this home insurance would work in practice, using ONLY values from this document.

Structure your scenario like this:
• Start with the Johnson family, who has this homeowners policy
• Show what happens if a tree falls on their roof (use actual dwelling coverage and deductible)
• Show what happens if their electronics are stolen (use actual personal property coverage)
• Show what happens if a guest is injured on their property (use actual liability coverage)
• Show what happens if they need to live elsewhere during repairs (use actual loss of use coverage)
• End with a SUMMARY explaining the key protections and out-of-pocket costs

IMPORTANT: Only include steps where you have real numbers from the document. Skip any step where the coverage isn't specified. NEVER invent or estimate dollar amounts.`,
    compareFields: `Category | Plan A | Plan B
Annual Premium | [value or "Not listed"] | [value or "Not listed"]
Deductible | [value or "Not listed"] | [value or "Not listed"]
Dwelling Coverage | [value or "Not listed"] | [value or "Not listed"]
Other Structures | [value or "Not listed"] | [value or "Not listed"]
Personal Property | [value or "Not listed"] | [value or "Not listed"]
Loss of Use | [value or "Not listed"] | [value or "Not listed"]
Personal Liability | [value or "Not listed"] | [value or "Not listed"]
Medical Payments | [value or "Not listed"] | [value or "Not listed"]
Water Damage | [value or "Not listed"] | [value or "Not listed"]
Hurricane Deductible | [value or "Not listed"] | [value or "Not listed"]
Flood Coverage | [value or "Not listed"] | [value or "Not listed"]
Replacement Cost | [value or "Not listed"] | [value or "Not listed"]`
  },
  life: {
    planOverviewFields: `Death Benefit (Face Value): [exact value from document, or "Not listed in document"]
Monthly Premium: [exact value from document, or "Not listed in document"]
Annual Premium: [exact value from document, or "Not listed in document"]
Policy Type: [exact value from document, or "Not listed in document"]
Term Length: [exact value from document, or "Not listed in document"]
Cash Value: [exact value from document, or "Not listed in document"]
Guaranteed Interest Rate: [exact value from document, or "Not listed in document"]
Convertibility: [exact value from document, or "Not listed in document"]
Renewability: [exact value from document, or "Not listed in document"]
Accidental Death Benefit: [exact value from document, or "Not listed in document"]
Waiver of Premium: [exact value from document, or "Not listed in document"]
Accelerated Death Benefit: [exact value from document, or "Not listed in document"]
Suicide Clause Period: [exact value from document, or "Not listed in document"]

Use "Not listed in document" only if a value truly isn't in the document.`,
    scenarioInstructions: `Create a realistic scenario showing how this life insurance would work in practice, using ONLY values from this document.

Structure your scenario like this:
• Start with David, age 35, who purchases this life insurance policy
• Show what David pays monthly/annually for coverage (use actual premium)
• Show what David's family would receive if he passes away (use actual death benefit)
• If term policy: Show what happens when the term ends (use actual term length and renewability)
• If whole life: Show how cash value might accumulate (use actual guaranteed rates)
• Show any riders or additional benefits included (use actual rider details)
• End with a SUMMARY explaining the key protections and costs

IMPORTANT: Only include steps where you have real numbers from the document. Skip any step where the details aren't specified. NEVER invent or estimate dollar amounts.`,
    compareFields: `Category | Plan A | Plan B
Death Benefit | [value or "Not listed"] | [value or "Not listed"]
Monthly Premium | [value or "Not listed"] | [value or "Not listed"]
Policy Type | [value or "Not listed"] | [value or "Not listed"]
Term Length | [value or "Not listed"] | [value or "Not listed"]
Cash Value | [value or "Not listed"] | [value or "Not listed"]
Guaranteed Rate | [value or "Not listed"] | [value or "Not listed"]
Convertibility | [value or "Not listed"] | [value or "Not listed"]
Renewability | [value or "Not listed"] | [value or "Not listed"]
Accidental Death Benefit | [value or "Not listed"] | [value or "Not listed"]
Waiver of Premium | [value or "Not listed"] | [value or "Not listed"]
Accelerated Death Benefit | [value or "Not listed"] | [value or "Not listed"]`
  },
  other: {
    planOverviewFields: `Policy Type: [exact value from document, or "Not listed in document"]
Monthly Premium: [exact value from document, or "Not listed in document"]
Annual Premium: [exact value from document, or "Not listed in document"]
Deductible: [exact value from document, or "Not listed in document"]
Coverage Limit: [exact value from document, or "Not listed in document"]
Per-Incident Limit: [exact value from document, or "Not listed in document"]
Annual Maximum: [exact value from document, or "Not listed in document"]
Waiting Period: [exact value from document, or "Not listed in document"]
Coverage Start Date: [exact value from document, or "Not listed in document"]
Exclusions: [exact value from document, or "Not listed in document"]
Copay/Coinsurance: [exact value from document, or "Not listed in document"]
Network Restrictions: [exact value from document, or "Not listed in document"]
Cancellation Policy: [exact value from document, or "Not listed in document"]

Use "Not listed in document" only if a value truly isn't in the document.`,
    scenarioInstructions: `Create a realistic scenario showing how this insurance would work in practice, using ONLY values from this document.

Structure your scenario like this:
• Start with a policyholder who has this insurance
• Show what happens when they need to file a claim (use actual deductible and coverage limits)
• Show what costs they would pay out of pocket (use actual copay/coinsurance)
• Show what the insurance covers (use actual coverage details)
• Show any limitations or exclusions that apply
• End with a SUMMARY explaining the key protections and out-of-pocket costs

IMPORTANT: Only include steps where you have real numbers from the document. Skip any step where the details aren't specified. NEVER invent or estimate dollar amounts.`,
    compareFields: `Category | Plan A | Plan B
Policy Type | [value or "Not listed"] | [value or "Not listed"]
Monthly Premium | [value or "Not listed"] | [value or "Not listed"]
Deductible | [value or "Not listed"] | [value or "Not listed"]
Coverage Limit | [value or "Not listed"] | [value or "Not listed"]
Per-Incident Limit | [value or "Not listed"] | [value or "Not listed"]
Annual Maximum | [value or "Not listed"] | [value or "Not listed"]
Waiting Period | [value or "Not listed"] | [value or "Not listed"]
Copay/Coinsurance | [value or "Not listed"] | [value or "Not listed"]
Network Restrictions | [value or "Not listed"] | [value or "Not listed"]
Key Exclusions | [value or "Not listed"] | [value or "Not listed"]`
  }
}

const insuranceTypeLabels: Record<InsuranceType, string> = {
  health: 'health insurance',
  auto: 'auto insurance',
  home: 'homeowners/renters insurance',
  life: 'life insurance',
  other: 'insurance'
}

export function getSingleAnalysisPrompt(insuranceType: InsuranceType): string {
  const config = insuranceConfigs[insuranceType]
  const label = insuranceTypeLabels[insuranceType]

  return `
CRITICAL RULE - READ THIS FIRST: Only report information EXPLICITLY stated in the document. If ANY value is not provided, you MUST write "Not listed in document" for that field. NEVER estimate, guess, or infer any costs, premiums, or plan details. When in doubt, write "Not listed in document".

Analyze this ${label} document and provide a clear explanation in plain English.

Please provide your response in this EXACT format with ONLY these 4 sections:

WHAT'S GOOD ABOUT THIS PLAN
• This plan would be good for you if [describe ideal user situation - max 40 words]
• [Coverage benefits - max 40 words]
• [Cost advantages - max 40 words]
• [Other key benefits - max 40 words]

WHAT TO WATCH OUT FOR
• Avoid getting this plan if [describe who should not choose this plan - max 40 words]
• [High costs or deductible concerns - max 40 words]
• [Coverage limitations or exclusions - max 40 words]
• [Other restrictions or issues - max 40 words]

PLAN OVERVIEW
${config.planOverviewFields}

REAL-WORLD SCENARIO: HOW THIS PLAN WORKS
${config.scenarioInstructions}

IMPORTANT: Keep ALL sentences to 40 words or less. Use simple language and define insurance terms in parentheses. NEVER use asterisks (*) anywhere in your response. Use bullet points (•) for all sections. Each bullet point must cover a DIFFERENT topic - no repetition.
`
}

export function getCompareAnalysisPrompt(insuranceType: InsuranceType, fileData: { name: string }[]): string {
  const config = insuranceConfigs[insuranceType]
  const label = insuranceTypeLabels[insuranceType]

  const planDetailsTemplate = fileData.map((f, i) => `PLAN ${String.fromCharCode(65 + i)} (${f.name})
Best for: [One sentence describing the ideal person for this plan]

Key Numbers:
• [Most important cost field]: [exact value from document, or "Not listed"]
• [Second most important field]: [exact value from document, or "Not listed"]
• [Third important field]: [exact value from document, or "Not listed"]
• [Fourth important field]: [exact value from document, or "Not listed"]
• [Fifth important field]: [exact value from document, or "Not listed"]

CHOOSE THIS PLAN IF:
• [Specific life situation where this plan wins]
• [Another good reason to pick this plan]
• [Who benefits most from this plan's structure]

WATCH OUT FOR:
• [Main downside or limitation in plain language]
• [Situations where this plan costs more]
• [Important coverage gaps to know about]
`).join('\n')

  return `
CRITICAL RULE - READ THIS FIRST: Only report information EXPLICITLY stated in the documents. If ANY value is not provided, you MUST write "Not listed" for that field. NEVER estimate, guess, or infer any costs, premiums, or plan details. When in doubt, write "Not listed".

Compare these ${fileData.length} ${label} plans and provide your response in this EXACT format with these 3 sections:

THE BOTTOM LINE
Write a friendly, conversational summary explaining who should choose each plan. Use full sentences, not bullet points. Write 1 paragraph per plan explaining who it's best for and why. Only mention specific dollar amounts that are EXPLICITLY stated in the documents. If a cost isn't listed, don't mention it.

SIDE-BY-SIDE NUMBERS
Create a comparison table with one row per line. Use this EXACT format with | as separator:

${config.compareFields}

Include all categories above. Use "Not listed" if a value isn't in the document. DO NOT estimate or guess any values.

PLAN DETAILS
For each plan, provide a card with key info:

${planDetailsTemplate}

Write in a warm, helpful tone like you're explaining to a friend who doesn't know much about insurance. Use proper terms but briefly explain what they mean in parentheses the first time. NEVER use asterisks (*) - use bullet points (•) only.
`
}

export function getSingleUrlAnalysisPrompt(insuranceType: InsuranceType): string {
  const config = insuranceConfigs[insuranceType]
  const label = insuranceTypeLabels[insuranceType]

  return `
CRITICAL RULE - READ THIS FIRST: Only report information EXPLICITLY stated in the content. If ANY value is not provided, you MUST write "Not listed in document" for that field. NEVER estimate, guess, or infer any costs, premiums, or plan details. When in doubt, write "Not listed in document".

Analyze this ${label} plan information from a webpage and provide a clear explanation in plain English.

Please provide your response in this EXACT format with ONLY these 4 sections:

WHAT'S GOOD ABOUT THIS PLAN
• This plan would be good for you if [describe ideal user situation - max 40 words]
• [Coverage benefits - max 40 words]
• [Cost advantages - max 40 words]
• [Other key benefits - max 40 words]

WHAT TO WATCH OUT FOR
• Avoid getting this plan if [describe who should not choose this plan - max 40 words]
• [High costs or deductible concerns - max 40 words]
• [Coverage limitations or exclusions - max 40 words]
• [Other restrictions or issues - max 40 words]

PLAN OVERVIEW
${config.planOverviewFields}

REAL-WORLD SCENARIO: HOW THIS PLAN WORKS
${config.scenarioInstructions}

IMPORTANT: Keep ALL sentences to 40 words or less. Use simple language and define insurance terms in parentheses. NEVER use asterisks (*) anywhere in your response. Use bullet points (•) for all sections. Each bullet point must cover a DIFFERENT topic - no repetition.
`
}

export function getCompareUrlAnalysisPrompt(insuranceType: InsuranceType, webpageContents: { url: string; content: string }[]): string {
  const config = insuranceConfigs[insuranceType]
  const label = insuranceTypeLabels[insuranceType]

  const planDetailsTemplate = webpageContents.map((wc, i) => {
    const hostname = new URL(wc.url).hostname
    return `PLAN ${String.fromCharCode(65 + i)} (${hostname})
Best for: [One sentence describing the ideal person for this plan]

Key Numbers:
• [Most important cost field]: [exact value from content, or "Not listed"]
• [Second most important field]: [exact value from content, or "Not listed"]
• [Third important field]: [exact value from content, or "Not listed"]
• [Fourth important field]: [exact value from content, or "Not listed"]
• [Fifth important field]: [exact value from content, or "Not listed"]

CHOOSE THIS PLAN IF:
• [Specific life situation where this plan wins]
• [Another good reason to pick this plan]
• [Who benefits most from this plan's structure]

WATCH OUT FOR:
• [Main downside or limitation in plain language]
• [Situations where this plan costs more]
• [Important coverage gaps to know about]
`
  }).join('\n')

  return `
CRITICAL RULE - READ THIS FIRST: Only report information EXPLICITLY stated in the content. If ANY value is not provided, you MUST write "Not listed" for that field. NEVER estimate, guess, or infer any costs, premiums, or plan details. When in doubt, write "Not listed".

Compare these ${webpageContents.length} ${label} plans and provide your response in this EXACT format with these 3 sections:

THE BOTTOM LINE
Write a friendly, conversational summary explaining who should choose each plan. Use full sentences, not bullet points. Write 1 paragraph per plan explaining who it's best for and why. Only mention specific dollar amounts that are EXPLICITLY stated in the content. If a cost isn't listed, don't mention it.

SIDE-BY-SIDE NUMBERS
Create a comparison table with one row per line. Use this EXACT format with | as separator:

${config.compareFields}

Include all categories above. Use "Not listed" if a value isn't in the content. DO NOT estimate or guess any values. Each row MUST have the category name, then |, then Plan A value, then |, then Plan B value.

PLAN DETAILS
For each plan, provide a card with key info:

${planDetailsTemplate}

Write in a warm, helpful tone like you're explaining to a friend who doesn't know much about insurance. Use proper terms but briefly explain what they mean in parentheses the first time. NEVER use asterisks (*) - use bullet points (•) only.
`
}
