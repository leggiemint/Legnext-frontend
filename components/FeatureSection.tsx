"use client";

const FeatureSection = () => {
  return (
    <>
      <style jsx>{`
        .feature-card {
          transition: all 0.3s ease;
        }
        
        .feature-card:hover {
          transform: translateY(-8px);
        }
      `}</style>
      
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What is <span className="bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] bg-clip-text text-transparent">Midjourney API</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Integrate licensed, AI-powered image and video generation with our Midjourney API — the easiest way to boost your app and grow your business.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1: All Core Midjourney Features */}
            <div className="feature-card bg-white rounded-xl p-8 h-full shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">All Core Midjourney Features</h3>
              <p className="text-gray-600 leading-relaxed">
                Text-to-image, Edit images, HD output, and AI video — all in one API.
              </p>
            </div>

            {/* Feature 2: Latest Models Supported */}
            <div className="feature-card bg-white rounded-xl p-8 h-full shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Latest Models Supported</h3>
              <p className="text-gray-600 leading-relaxed">
                V7, V6, and Niji for every creative style.
              </p>
            </div>

            {/* Feature 3: Enterprise-Grade Stability */}
            <div className="feature-card bg-white rounded-xl p-8 h-full shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Enterprise-Grade Stability</h3>
              <p className="text-gray-600 leading-relaxed">
                Reliable uptime and smooth performance for any workload.
              </p>
            </div>

            {/* Feature 4: Built for Bulk Creation */}
            <div className="feature-card bg-white rounded-xl p-8 h-full shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Built for Bulk Creation</h3>
              <p className="text-gray-600 leading-relaxed">
                Batch generate and iterate fast for business-scale needs.
              </p>
            </div>

            {/* Feature 5: Speed Modes */}
            <div className="feature-card bg-white rounded-xl p-8 h-full shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Speed Modes</h3>
              <p className="text-gray-600 leading-relaxed">
                Switch between Fast and Turbo for the best balance of speed and cost.
              </p>
            </div>

            {/* Feature 6: Video Generation Ready */}
            <div className="feature-card bg-white rounded-xl p-8 h-full shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Video Generation Ready</h3>
              <p className="text-gray-600 leading-relaxed">
                Works with Midjourney&apos;s newest AI video model.
              </p>
            </div>

          </div>

          {/* Bottom CTA */}
          <div className="flex justify-center mt-16">
            <a
              href="#"
              className="bg-[#8b5cf6] hover:bg-[#8b5cf6]/90 text-white font-semibold px-6 py-2 rounded-full transition-all hover:scale-105 inline-flex items-center gap-2"
            >
              <span>Get API Access Now</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default FeatureSection;
