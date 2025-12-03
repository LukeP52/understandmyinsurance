import Link from 'next/link'
import Footer from '@/components/Footer'

export default function TermsPage() {
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
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-black mb-4">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: December 2024</p>

          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Agreement to Terms</h2>
              <p>
                By accessing or using Understand My Insurance ("the Service"), you agree to be bound by these
                Terms of Service. If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Description of Service</h2>
              <p>
                Understand My Insurance is a tool that analyzes insurance documents and provides plain-language
                explanations of coverage, costs, and terms. The Service is designed to help users better
                understand their insurance policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Important Disclaimers</h2>
              <div className="bg-gray-100 rounded-lg p-6 space-y-4">
                <p>
                  <strong>Not Insurance Advice:</strong> The analysis provided by this Service is for
                  informational purposes only. It is not insurance advice, legal advice, or a substitute
                  for reading your actual policy documents.
                </p>
                <p>
                  <strong>No Guarantee of Accuracy:</strong> While we strive for accuracy, we cannot guarantee
                  that our analysis is complete, accurate, or up-to-date. Insurance policies are complex
                  documents, and important details may be missed or misinterpreted.
                </p>
                <p>
                  <strong>Consult Professionals:</strong> For important decisions about your coverage, claims,
                  or insurance needs, always consult with a licensed insurance professional or your insurance
                  provider directly.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">User Responsibilities</h2>
              <p className="mb-4">By using the Service, you agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Only upload documents you are authorized to access and share</li>
                <li>Not use the Service for any unlawful purpose</li>
                <li>Not attempt to interfere with or disrupt the Service</li>
                <li>Provide accurate information when creating an account</li>
                <li>Keep your account credentials secure</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Acceptable Use</h2>
              <p className="mb-4">You may not use the Service to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Upload malicious files or content</li>
                <li>Attempt to access other users' data</li>
                <li>Reverse engineer or copy our technology</li>
                <li>Resell or redistribute the Service without permission</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Intellectual Property</h2>
              <p>
                The Service, including its original content, features, and functionality, is owned by
                Understand My Insurance and is protected by copyright, trademark, and other intellectual
                property laws. You may not copy, modify, or distribute any part of the Service without
                our written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Understand My Insurance shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages, or any loss of profits
                or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill,
                or other intangible losses resulting from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Service Availability</h2>
              <p>
                We strive to provide reliable service, but we do not guarantee that the Service will be
                available at all times. We may modify, suspend, or discontinue the Service at any time
                without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Account Termination</h2>
              <p>
                We reserve the right to terminate or suspend your account at any time for any reason,
                including violation of these terms. You may delete your account at any time through
                your account settings or by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Changes to Terms</h2>
              <p>
                We may revise these Terms of Service at any time. By continuing to use the Service after
                changes become effective, you agree to be bound by the revised terms. We will provide
                notice of significant changes through the Service or via email.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the
                United States, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Contact</h2>
              <p>
                If you have questions about these Terms of Service, please contact us at{' '}
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
