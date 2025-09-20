import MainLayout from "@/components/layout/MainLayout";
import { getSEOTags } from "@/libs/seo";

// 文档页面是静态内容，可以缓存
// export const dynamic = 'force-dynamic';

export const metadata = getSEOTags({
  title: "Midjourney Pan | AI Image Extension API",
  description: "Learn about Midjourney's pan functionality and how to use our /pan API to extend images in specific directions.",
  keywords: ["midjourney pan", "ai image extension", "image expansion", "midjourney api", "directional extension"],
  canonical: "/pan",
});

const Pan = () => {
  return (
    <MainLayout>
      <main className="min-h-screen pt-24 pb-20">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Midjourney <span className="bg-gradient-to-r from-[#4f46e5] to-[#4f46e5]/80 bg-clip-text text-transparent">Pan</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Extend existing images in a single specified direction with precise directional expansion using our /pan API.
            </p>
          </div>
        </section>

        {/* What is Pan */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              What is <span className="text-[#4f46e5]">Pan</span>?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Extend your images in one specific direction (up, down, left, or right) while maintaining visual continuity.
            </p>
          </div>
        </section>

        {/* API Integration */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Use <span className="text-[#4f46e5]">/pan</span> API
              </h2>
              <p className="text-lg text-gray-600">
                Integrate Midjourney&apos;s pan functionality directly into your applications.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">API Example</h3>
              <div className="bg-gray-900 rounded p-4 mb-4">
                <pre className="text-green-400 text-sm overflow-x-auto">
{`curl --location 'https://api.legnext.ai/api/v1/pan' \\
--header 'x-api-key: YOUR_API_KEY' \\
--header 'Content-Type: application/json' \\
--data '{
    "jobId": "job_12345",
    "imageNo": 0,
    "direction": 1,
    "scale": 1.5,
    "remixPrompt": "Continue the forest path to the right",
    "callback": "https://your-domain.com/webhook"
}'`}
                </pre>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <h4 className="font-semibold text-blue-900 mb-2">Parameters</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li><span className="font-mono">jobId</span>: Original image generation task ID</li>
                    <li><span className="font-mono">imageNo</span>: Image number to extend (0-3)</li>
                    <li><span className="font-mono">direction</span>: Extension direction (0-3)</li>
                    <li><span className="font-mono">scale</span>: Extension ratio (1.1-3.0)</li>
                    <li><span className="font-mono">remixPrompt</span>: Text prompt for extended area</li>
                    <li><span className="font-mono">callback</span>: Webhook URL</li>
                  </ul>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <h4 className="font-semibold text-green-900 mb-2">Response</h4>
                  <p className="text-sm text-green-800">Returns job ID, status, and up to 4 extended image URLs</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Direction Values</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded p-3 text-center">
                    <div className="w-8 h-8 bg-[#4f46e5] rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">0</div>
                    <span className="text-sm font-semibold text-gray-900">Down</span>
                  </div>
                  <div className="bg-gray-50 rounded p-3 text-center">
                    <div className="w-8 h-8 bg-[#4f46e5] rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">1</div>
                    <span className="text-sm font-semibold text-gray-900">Right</span>
                  </div>
                  <div className="bg-gray-50 rounded p-3 text-center">
                    <div className="w-8 h-8 bg-[#4f46e5] rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">2</div>
                    <span className="text-sm font-semibold text-gray-900">Up</span>
                  </div>
                  <div className="bg-gray-50 rounded p-3 text-center">
                    <div className="w-8 h-8 bg-[#4f46e5] rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">3</div>
                    <span className="text-sm font-semibold text-gray-900">Left</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-[#4f46e5] to-[#4f46e5]/80 rounded-lg p-8 text-center text-white">
              <h2 className="text-2xl font-bold mb-4">
                Ready to Extend Images?
              </h2>
              <p className="text-lg mb-6 opacity-90">
                Get started with our /pan API today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/pricing" 
                  className="bg-white text-[#4f46e5] hover:bg-gray-100 font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  View Pricing
                </a>
                <a 
                  href="https://docs.legnext.ai/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-white text-white hover:bg-white hover:text-[#4f46e5] font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  Documentation
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </MainLayout>
  );
};

export default Pan;
