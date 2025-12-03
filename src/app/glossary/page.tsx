import Link from 'next/link'
import Footer from '@/components/Footer'

const glossaryTerms = [
  {
    category: 'General Terms',
    terms: [
      {
        term: 'Premium',
        definition: 'The amount you pay for your insurance policy, usually monthly or annually. Think of it as your membership fee to have coverage.'
      },
      {
        term: 'Deductible',
        definition: 'The amount you pay out of pocket before your insurance starts covering costs. For example, with a $1,000 deductible, you pay the first $1,000 of covered expenses.'
      },
      {
        term: 'Copay (Copayment)',
        definition: 'A fixed amount you pay for a covered service. For example, $25 for a doctor visit or $15 for a prescription.'
      },
      {
        term: 'Coinsurance',
        definition: 'Your share of costs after meeting your deductible, expressed as a percentage. If you have 20% coinsurance, you pay 20% and insurance pays 80%.'
      },
      {
        term: 'Out-of-Pocket Maximum',
        definition: 'The most you\'ll pay for covered services in a year. After reaching this limit, insurance pays 100% of covered costs.'
      },
      {
        term: 'Claim',
        definition: 'A request you or your provider submits to your insurance company asking them to pay for covered services.'
      },
      {
        term: 'Coverage',
        definition: 'The services, treatments, or events that your insurance policy will pay for.'
      },
      {
        term: 'Exclusion',
        definition: 'Services or situations that your insurance policy does not cover.'
      },
      {
        term: 'Rider',
        definition: 'An add-on to your policy that provides extra coverage, usually for an additional cost.'
      },
      {
        term: 'Underwriting',
        definition: 'The process insurance companies use to evaluate your risk and determine your premium.'
      }
    ]
  },
  {
    category: 'Health Insurance',
    terms: [
      {
        term: 'Network',
        definition: 'The group of doctors, hospitals, and other healthcare providers that have agreed to provide services at negotiated rates for your insurance plan.'
      },
      {
        term: 'In-Network vs Out-of-Network',
        definition: 'In-network providers have agreements with your insurer and cost less. Out-of-network providers don\'t, so you\'ll pay more or coverage may not apply.'
      },
      {
        term: 'HMO (Health Maintenance Organization)',
        definition: 'A plan that typically requires you to choose a primary care doctor and get referrals for specialists. Usually lower cost but less flexibility.'
      },
      {
        term: 'PPO (Preferred Provider Organization)',
        definition: 'A plan that lets you see any provider without referrals, but costs less if you use in-network providers. More flexibility but often higher premiums.'
      },
      {
        term: 'EPO (Exclusive Provider Organization)',
        definition: 'Similar to an HMO but usually without referral requirements. You must use network providers except in emergencies.'
      },
      {
        term: 'Primary Care Physician (PCP)',
        definition: 'Your main doctor who provides general care and coordinates your healthcare. Some plans require you to choose one.'
      },
      {
        term: 'Preventive Care',
        definition: 'Services like annual checkups, vaccinations, and screenings that are meant to prevent illness. Often covered at 100% by insurance.'
      },
      {
        term: 'Formulary',
        definition: 'A list of prescription drugs covered by your plan. Drugs are usually grouped into tiers with different costs.'
      },
      {
        term: 'Prior Authorization',
        definition: 'Approval you need from your insurance company before getting certain services or medications for them to be covered.'
      }
    ]
  },
  {
    category: 'Auto Insurance',
    terms: [
      {
        term: 'Liability Coverage',
        definition: 'Pays for damage you cause to others in an accident. Includes bodily injury (their medical bills) and property damage (their car/property).'
      },
      {
        term: 'Collision Coverage',
        definition: 'Pays to repair or replace your car if you hit another vehicle or object, regardless of who\'s at fault.'
      },
      {
        term: 'Comprehensive Coverage',
        definition: 'Pays for damage to your car from non-collision events like theft, vandalism, weather, or hitting an animal.'
      },
      {
        term: 'Uninsured/Underinsured Motorist',
        definition: 'Protects you if you\'re hit by a driver who has no insurance or not enough insurance to cover your damages.'
      },
      {
        term: 'Personal Injury Protection (PIP)',
        definition: 'Covers medical expenses for you and your passengers regardless of who caused the accident. Required in some states.'
      },
      {
        term: 'Medical Payments Coverage',
        definition: 'Pays for medical expenses for you and your passengers after an accident, regardless of fault. Similar to PIP but usually with lower limits.'
      }
    ]
  },
  {
    category: 'Home Insurance',
    terms: [
      {
        term: 'Dwelling Coverage',
        definition: 'Pays to repair or rebuild your home\'s structure if it\'s damaged by covered events like fire, wind, or vandalism.'
      },
      {
        term: 'Personal Property Coverage',
        definition: 'Covers your belongings (furniture, electronics, clothing) if they\'re stolen or damaged.'
      },
      {
        term: 'Liability Protection',
        definition: 'Covers you if someone is injured on your property or if you accidentally damage someone else\'s property.'
      },
      {
        term: 'Additional Living Expenses (ALE)',
        definition: 'Pays for temporary housing, food, and other costs if you can\'t live in your home due to covered damage.'
      },
      {
        term: 'Replacement Cost vs Actual Cash Value',
        definition: 'Replacement cost pays to replace items at today\'s prices. Actual cash value deducts for depreciation, so you get less.'
      },
      {
        term: 'Flood Insurance',
        definition: 'Separate policy covering flood damage. Standard home insurance doesn\'t cover floods.'
      }
    ]
  },
  {
    category: 'Life Insurance',
    terms: [
      {
        term: 'Face Value (Death Benefit)',
        definition: 'The amount your beneficiaries receive when you die. This is the main payout of the policy.'
      },
      {
        term: 'Term Life Insurance',
        definition: 'Coverage for a specific period (like 20 years). If you die during the term, your beneficiaries get the payout. Usually the most affordable option.'
      },
      {
        term: 'Whole Life Insurance',
        definition: 'Permanent coverage that lasts your entire life and includes a savings component (cash value). More expensive than term.'
      },
      {
        term: 'Beneficiary',
        definition: 'The person or people who receive your life insurance payout when you die.'
      },
      {
        term: 'Cash Value',
        definition: 'A savings component in permanent life insurance that grows over time. You can borrow against it or surrender the policy for this amount.'
      },
      {
        term: 'Contestability Period',
        definition: 'Usually the first 2 years of a policy when the insurer can investigate and deny claims for misrepresentation on your application.'
      }
    ]
  }
]

export default function GlossaryPage() {
  return (
    <div className="min-h-screen bg-beige-100 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-bold text-black hover:text-gray-700 transition-colors">
            Understand My Insurance
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-black mb-4">Insurance Glossary</h1>
          <p className="text-lg text-gray-700 mb-12">
            Insurance is full of confusing terms. Here's what they actually mean, in plain English.
          </p>

          <div className="space-y-12">
            {glossaryTerms.map((category) => (
              <section key={category.category}>
                <h2 className="text-2xl font-bold text-black mb-6 pb-2 border-b-2 border-black">
                  {category.category}
                </h2>
                <div className="space-y-6">
                  {category.terms.map((item) => (
                    <div key={item.term} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                      <h3 className="text-lg font-bold text-black mb-2">{item.term}</h3>
                      <p className="text-gray-700">{item.definition}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-600 mb-4">
              Still confused about something in your policy? Upload it and we'll explain it.
            </p>
            <Link
              href="/"
              className="inline-block bg-black text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Analyze Your Insurance
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
