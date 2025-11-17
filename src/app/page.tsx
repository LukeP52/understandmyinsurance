export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Understand My Insurance
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Making insurance simple and understandable for everyone. 
            Get clarity on your coverage and make informed decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors">
              Get Started
            </button>
            <button className="border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-8 py-3 rounded-lg transition-colors">
              Learn More
            </button>
          </div>
        </div>
        
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Simple Explanations</h3>
            <p className="text-gray-600">
              We break down complex insurance terms into plain English that everyone can understand.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Coverage Analysis</h3>
            <p className="text-gray-600">
              Get insights into your current coverage and identify potential gaps in protection.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Decisions</h3>
            <p className="text-gray-600">
              Make informed choices about your insurance with our expert guidance and tools.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}