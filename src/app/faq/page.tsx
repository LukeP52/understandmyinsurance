import Link from 'next/link'
import Footer from '@/components/Footer'

const faqs = [
  {
    question: 'How does this work?',
    answer: 'Upload a PDF of your insurance policy or paste a link to your plan details page. We\'ll analyze the document and give you a clear, plain-English breakdown of what\'s covered, what\'s not, and what you should watch out for.'
  },
  {
    question: 'What file types do you accept?',
    answer: 'We accept PDF files up to 5MB. You can also paste a direct link to your insurance plan\'s details page if you don\'t have a PDF.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes. Your privacy is our priority. We delete uploaded PDFs immediately after analysis - they\'re not stored on our servers. The analysis happens in real-time, and once it\'s complete, your document is gone.'
  },
  {
    question: 'How long do you keep my documents?',
    answer: 'We don\'t keep them at all. Documents are deleted immediately after analysis. We only retain the generated analysis, not the source document.'
  },
  {
    question: 'Is this free?',
    answer: 'Yes, the service is currently free to use. We may introduce premium features in the future, but core functionality will remain accessible.'
  },
  {
    question: 'What types of insurance do you support?',
    answer: 'We support health, auto, home, and life insurance. We also have an "Other" option for less common insurance types like pet, travel, or renters insurance.'
  },
  {
    question: 'Can I compare multiple plans?',
    answer: 'Yes! You can upload up to 5 PDFs or URLs and we\'ll compare them side by side, showing you the key differences and which plan might be best for different situations.'
  },
  {
    question: 'How accurate is the analysis?',
    answer: 'Our analysis is designed to help you understand your coverage, but it\'s not a substitute for reading your actual policy or consulting with an insurance professional. Always verify important details with your insurance provider.'
  },
  {
    question: 'Why can\'t you read some websites?',
    answer: 'Some insurance company websites use technology that prevents automated access. If we can\'t read a URL, try downloading the Summary of Benefits PDF from your insurer\'s website and uploading that instead.'
  },
  {
    question: 'Do I need to create an account?',
    answer: 'No. You can use the service without signing up. Creating an account is optional and allows you to access additional features in the future.'
  },
  {
    question: 'What should I do if my analysis seems wrong?',
    answer: 'Our tool is designed to help you understand your coverage, but insurance documents can be complex. If something seems off, we recommend contacting your insurance provider directly to clarify specific coverage questions.'
  },
  {
    question: 'Can I download my analysis?',
    answer: 'Yes. After receiving your analysis, you can download it as a PDF for your records.'
  }
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-beige-100 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center space-x-4">
          <Link
            href="/"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
            aria-label="Go home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
          <Link href="/" className="text-xl font-bold text-black hover:text-gray-700 transition-colors">
            Understand My Insurance
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-black mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-gray-700 mb-12">
            Got questions? We've got answers.
          </p>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-black mb-3">{faq.question}</h3>
                <p className="text-gray-700">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-600 mb-4">
              Have a question we didn't answer? Reach out to us.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-black text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
