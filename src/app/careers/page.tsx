import Link from 'next/link'
import Footer from '@/components/Footer'

export default function CareersPage() {
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
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black text-black mb-4">Careers</h1>
          <p className="text-lg text-gray-700 mb-12">
            Join us in making insurance easier to understand for everyone.
          </p>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 text-left">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👋</span>
              </div>
              <h2 className="text-2xl font-bold text-black mb-2">We're Not Hiring Right Now</h2>
              <p className="text-gray-600">
                But we're always interested in meeting passionate people.
              </p>
            </div>

            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-bold text-black mb-2">Who We're Looking For (Eventually)</h3>
                <p className="text-gray-700">
                  We're a small team building tools to simplify life's complicated stuff. When we do hire,
                  we look for people who:
                </p>
                <ul className="mt-4 space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-black mr-2">•</span>
                    <span>Are passionate about making complex things simple</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2">•</span>
                    <span>Have experience with insurance, fintech, or consumer products</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2">•</span>
                    <span>Care deeply about user experience and clear communication</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2">•</span>
                    <span>Can work independently and take ownership of projects</span>
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold text-black mb-2">Get in Touch</h3>
                <p className="text-gray-700">
                  Think you'd be a great fit? We'd love to hear from you. Drop us a line and tell us
                  about yourself - what you're working on, what excites you, and why you care about
                  making insurance less confusing.
                </p>
                <div className="mt-4">
                  <a
                    href="mailto:support@snumps.com"
                    className="inline-block bg-black text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Email Us: support@snumps.com
                  </a>
                </div>
              </section>
            </div>
          </div>

          <div className="mt-12">
            <p className="text-gray-600 mb-4">
              Want to learn more about what we're building?
            </p>
            <Link
              href="/about"
              className="text-blue-600 hover:text-blue-800 font-medium underline"
            >
              Read about our mission
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
