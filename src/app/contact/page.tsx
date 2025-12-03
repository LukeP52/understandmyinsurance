import Link from 'next/link'
import Footer from '@/components/Footer'

export default function ContactPage() {
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
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-black mb-4">Contact Us</h1>
          <p className="text-lg text-gray-700 mb-12">
            Have a question, feedback, or just want to say hi? We'd love to hear from you.
          </p>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-bold text-black mb-3">Email Us</h2>
                <p className="text-gray-700 mb-4">
                  The best way to reach us is by email. We typically respond within 24-48 hours.
                </p>
                <a
                  href="mailto:support@snumps.com"
                  className="text-lg font-medium text-blue-600 hover:text-blue-800 underline"
                >
                  support@snumps.com
                </a>
              </section>

              <section>
                <h2 className="text-xl font-bold text-black mb-3">What We Can Help With</h2>
                <ul className="text-gray-700 space-y-2">
                  <li className="flex items-start">
                    <span className="text-black mr-2">•</span>
                    <span>Questions about how the service works</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2">•</span>
                    <span>Technical issues or bugs</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2">•</span>
                    <span>Feature requests and suggestions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2">•</span>
                    <span>Privacy concerns</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2">•</span>
                    <span>Partnership inquiries</span>
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-black mb-3">Important Note</h2>
                <p className="text-gray-700">
                  We're here to help you understand insurance terminology and use our tool, but we can't
                  provide specific insurance advice. For questions about your coverage, claims, or policy
                  details, please contact your insurance provider directly.
                </p>
              </section>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              Looking for answers to common questions?
            </p>
            <Link
              href="/faq"
              className="text-blue-600 hover:text-blue-800 font-medium underline"
            >
              Check our FAQ
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
