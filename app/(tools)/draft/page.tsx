import MainLayout from "@/components/layout/MainLayout";
import { getSEOTags } from "@/libs/seo";

// 文档页面是静态内容，可以缓存
// export const dynamic = 'force-dynamic';

export const metadata = getSEOTags({
  title: "Midjourney Draft Mode | Fast AI Image Generation",
  description: "Learn about Midjourney's draft mode for ultra-fast image prototyping with half GPU usage and how to use it with our API.",
  keywords: ["midjourney draft mode", "fast image generation", "ai prototyping", "midjourney api", "draft mode"],
  canonical: "/draft",
});

const Draft = () => {
  return (
    <MainLayout>
      <main className="min-h-screen pt-24 pb-20">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Midjourney <span className="bg-gradient-to-r from-[#4f46e5] to-[#4f46e5]/80 bg-clip-text text-transparent">Draft Mode</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Speed up your creative workflow with ultra-fast image prototyping using half the GPU power!
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-yellow-800 font-medium">
                ⚠️ This feature is only compatible with version 7.
              </p>
            </div>
          </div>
        </section>

        {/* What is Draft Mode */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              What is <span className="text-[#4f46e5]">Draft Mode</span>?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Draft mode is an ultra-fast way to prototype images, using only half the GPU power for rapid iteration.
            </p>
          </div>
        </section>

        {/* How to Use */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                How to Use
              </h2>
              <p className="text-lg text-gray-600">
                Add the --draft command to any prompt to run in draft mode.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Example Usage</h3>
              <div className="bg-gray-900 rounded p-4 mb-4">
                <pre className="text-green-400 text-sm overflow-x-auto">
{`/imagine prompt: A beautiful sunset over mountains --draft --v 7`}
                </pre>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Benefits</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Ultra-fast generation</li>
                    <li>• Half GPU usage</li>
                    <li>• Perfect for prototyping</li>
                    <li>• Quick iteration cycles</li>
                  </ul>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Quality Enhancement</h4>
                  <p className="text-sm text-green-800">
                    If you&apos;re happy with a draft image, use the enhance feature to regenerate it with higher quality settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* API Integration */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                API Integration
              </h2>
              <p className="text-lg text-gray-600">
                Use draft mode with our /diffusion API for rapid prototyping.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">API Example</h3>
              <div className="bg-gray-900 rounded p-4 mb-4">
                <pre className="text-green-400 text-sm overflow-x-auto">
{`curl --location 'https://api.legnext.ai/api/v1/diffusion' \\
--header 'x-api-key: YOUR_API_KEY' \\
--header 'Content-Type: application/json' \\
--data '{
    "text": "A beautiful sunset over mountains --draft --v 7",
    "callback": "https://your-domain.com/webhook"
}'`}
                </pre>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">Important Notes</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Draft mode only works with --v 7</li>
                  <li>• Use --draft in your prompt text</li>
                  <li>• Consumes half the normal GPU points</li>
                  <li>• Perfect for rapid iteration and testing</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-[#4f46e5] to-[#4f46e5]/80 rounded-lg p-8 text-center text-white">
              <h2 className="text-2xl font-bold mb-4">
                Ready to Speed Up Your Workflow?
              </h2>
              <p className="text-lg mb-6 opacity-90">
                Start using draft mode with our API today.
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

export default Draft;
