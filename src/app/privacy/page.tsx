import Link from 'next/link'
import Footer from '@/components/Footer'

export default function PrivacyPage() {
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
          <h1 className="text-4xl md:text-5xl font-black text-black mb-4">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: December 2024</p>

          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Overview</h2>
              <p>
                Your privacy is important to us. This policy explains how Understand My Insurance
                ("we", "us", or "our") collects, uses, and protects your information when you use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Document Handling</h2>
              <p className="mb-4">
                <strong>We do not store your uploaded documents.</strong> When you upload a PDF or provide a URL:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your document is processed in real-time to generate the analysis</li>
                <li>The document is deleted immediately after analysis is complete</li>
                <li>We do not retain copies of your insurance documents on our servers</li>
                <li>Only the generated analysis text may be retained for your future reference</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Information We Collect</h2>
              <p className="mb-4">We collect the following types of information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Account information:</strong> If you create an account, we collect your email address
                  and password (securely hashed).
                </li>
                <li>
                  <strong>Usage data:</strong> We collect anonymous usage statistics to improve our service,
                  such as which features are used most frequently.
                </li>
                <li>
                  <strong>Analysis results:</strong> We may store the text output of analyses to allow you
                  to access them later.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>To provide and improve our insurance analysis service</li>
                <li>To communicate with you about your account or our service</li>
                <li>To ensure the security and integrity of our platform</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Third-Party Services</h2>
              <p className="mb-4">We use the following third-party services to operate our platform:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Firebase (Google):</strong> For authentication and temporary file storage.
                  Files are deleted immediately after processing.
                </li>
                <li>
                  <strong>Google Gemini:</strong> For document analysis. Your document content is processed
                  by Google's services to generate the analysis.
                </li>
              </ul>
              <p className="mt-4">
                These services have their own privacy policies that govern how they handle data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your information. This includes
                encrypted connections (HTTPS), secure authentication, and immediate deletion of uploaded documents.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your account information</li>
                <li>Delete your account and associated data</li>
                <li>Request information about how your data is used</li>
                <li>Opt out of non-essential communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Cookies</h2>
              <p>
                We use essential cookies to maintain your session and preferences. We do not use
                tracking cookies for advertising purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Children's Privacy</h2>
              <p>
                Our service is not intended for children under 13 years of age. We do not knowingly
                collect personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify you of any significant
                changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Contact Us</h2>
              <p>
                If you have questions about this privacy policy or our data practices, please contact us at{' '}
                <a href="mailto:support@snumps.com" className="text-blue-600 hover:text-blue-800 underline">
                  support@snumps.com
                </a>.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link
              href="/"
              className="inline-block bg-black text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
