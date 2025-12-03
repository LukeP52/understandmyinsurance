import Link from 'next/link'
import Footer from '@/components/Footer'

export default function AboutPage() {
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
          <h1 className="text-4xl md:text-5xl font-black text-black mb-8">About Us</h1>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Our Mission</h2>
              <p className="text-lg">
                We believe understanding your insurance shouldn't require a law degree. That's why we built
                Understand My Insurance - to translate the complex world of insurance into plain English
                that anyone can understand.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Who We Are</h2>
              <p className="text-lg">
                We're a team of insurance professionals who got tired of watching people struggle with
                confusing policy documents. After years of explaining the same concepts over and over,
                we decided to build a tool that could do it for everyone, instantly.
              </p>
              <p className="text-lg mt-4">
                We've worked in the insurance industry and seen firsthand how complicated it can be.
                Deductibles, copays, coinsurance, out-of-pocket maximums - these terms matter a lot
                when you're choosing a plan or filing a claim, but most people don't fully understand them.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Why We Built This</h2>
              <p className="text-lg">
                Insurance is one of the most important financial decisions you'll make, yet the industry
                makes it nearly impossible for regular people to understand what they're buying. We think
                that's wrong.
              </p>
              <p className="text-lg mt-4">
                Every year, people overpay for coverage they don't need, or worse, discover gaps in their
                coverage when it's too late. We built this tool to help you understand exactly what you're
                getting before you need to use it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Your Privacy Matters</h2>
              <p className="text-lg">
                We know insurance documents contain sensitive information. That's why we've built our
                system to delete your uploaded documents immediately after analysis. We don't store your
                PDFs - they're processed and then gone. Your privacy isn't just a feature; it's a promise.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Part of the Snumps Family</h2>
              <p className="text-lg">
                Understand My Insurance is brought to you by{' '}
                <a
                  href="https://snumps.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Snumps
                </a>
                , where we're building tools to make life's complicated stuff simple.
              </p>
            </section>

            <div className="pt-8 border-t border-gray-200">
              <Link
                href="/"
                className="inline-block bg-black text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Analyze Your Insurance
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
