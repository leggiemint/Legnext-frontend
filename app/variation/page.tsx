import MainLayout from "@/components/MainLayout";
import { getSEOTags } from "@/libs/seo";

export const dynamic = 'force-dynamic';

export const metadata = getSEOTags({
  title: "Midjourney Variation | AI Image Variation API",
  description: "Learn about Midjourney's variation functionality and how to use our /variation API to generate image variations.",
  keywords: ["midjourney variation", "ai image variation", "image generation api", "midjourney api"],
  canonical: "/variation",
});

const Variation = () => {
  return (
    <MainLayout>
      <main className="min-h-screen pt-24 pb-20">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Midjourney <span className="bg-gradient-to-r from-[#4f46e5] to-[#4f46e5]/80 bg-clip-text text-transparent">Variation</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Generate variations of existing images with controllable transformation intensity using our /variation API.
            </p>
          </div>
        </section>

        {/* What is Variation */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              What is <span className="text-[#4f46e5]">Variation</span>?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Generate variations of existing images while maintaining the original composition structure.
            </p>
          </div>
        </section>

        {/* API Integration */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Use <span className="text-[#4f46e5]">/variation</span> API
              </h2>
              <p className="text-lg text-gray-600">
                Integrate Midjourney&apos;s variation functionality directly into your applications.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">API Example</h3>
              <div className="bg-gray-900 rounded p-4 mb-4">
                <pre className="text-green-400 text-sm overflow-x-auto">
{`curl --location 'https://api.legnext.ai/api/v1/variation' \\
--header 'x-api-key: YOUR_API_KEY' \\
--header 'Content-Type: application/json' \\
--data '{
    "jobId": "job_12345",
    "imageNo": 0,
    "type": 0,
    "remixPrompt": "Add more colorful flowers in the garden",
    "callback": "https://your-domain.com/webhook"
}'`}
                </pre>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <h4 className="font-semibold text-blue-900 mb-2">Parameters</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li><span className="font-mono">jobId</span>: Original image generation task ID</li>
                    <li><span className="font-mono">imageNo</span>: Image number to vary (0-3)</li>
                    <li><span className="font-mono">type</span>: Variation type (0=Subtle, 1=Strong)</li>
                    <li><span className="font-mono">remixPrompt</span>: Optional guided variation prompt</li>
                    <li><span className="font-mono">callback</span>: Webhook URL</li>
                  </ul>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <h4 className="font-semibold text-green-900 mb-2">Response</h4>
                  <p className="text-sm text-green-800">Returns job ID, status, and up to 4 variation image URLs</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Variation Types</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded p-3">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-[#4f46e5] rounded flex items-center justify-center text-white text-sm font-bold mr-2">0</div>
                      <span className="font-semibold text-gray-900">Subtle</span>
                    </div>
                    <p className="text-sm text-gray-600">Minor changes while preserving most original elements</p>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-[#4f46e5] rounded flex items-center justify-center text-white text-sm font-bold mr-2">1</div>
                      <span className="font-semibold text-gray-900">Strong</span>
                    </div>
                    <p className="text-sm text-gray-600">More dramatic variations with significant changes</p>
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
                Ready to Create Variations?
              </h2>
              <p className="text-lg mb-6 opacity-90">
                Get started with our /variation API today.
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

export default Variation;
