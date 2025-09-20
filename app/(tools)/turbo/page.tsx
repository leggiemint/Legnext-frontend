import MainLayout from "@/components/layout/MainLayout";
import { getSEOTags } from "@/libs/seo";

// 文档页面是静态内容，可以缓存
// export const dynamic = 'force-dynamic';

export const metadata = getSEOTags({
  title: "Midjourney Turbo Mode | Ultra-Fast AI Image Generation",
  description: "Learn about Midjourney's turbo mode for ultra-fast image generation with 4x speed of fast mode using high-performance GPU pools.",
  keywords: ["midjourney turbo mode", "ultra-fast image generation", "high-performance gpu", "midjourney api", "turbo speed"],
  canonical: "/turbo",
});

const Turbo = () => {
  return (
    <MainLayout>
      <main className="min-h-screen pt-24 pb-20">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Midjourney <span className="bg-gradient-to-r from-[#4f46e5] to-[#4f46e5]/80 bg-clip-text text-transparent">Turbo Mode</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Ultra-fast image generation with 4x the speed of fast mode using high-performance GPU pools.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-orange-800 font-medium">
                ⚠️ Experimental feature - availability and billing may change
              </p>
            </div>
          </div>
        </section>

        {/* What is Turbo Mode */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              What is <span className="text-[#4f46e5]">Turbo Mode</span>?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Turbo mode uses high-performance GPU pools to achieve up to 4x faster processing than fast mode, consuming double the GPU time quota.
            </p>
          </div>
        </section>

        {/* Speed Comparison */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Speed Comparison
              </h2>
              <p className="text-lg text-gray-600">
                See how turbo mode compares to other speed options.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center text-white font-bold mx-auto mb-2">Fast</div>
                  <h3 className="text-lg font-semibold text-gray-900">Fast Mode</h3>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 1x processing speed</li>
                  <li>• Standard GPU quota</li>
                  <li>• ~1 minute completion</li>
                  <li>• Default mode</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-[#4f46e5]">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-[#4f46e5] rounded-lg flex items-center justify-center text-white font-bold mx-auto mb-2">Turbo</div>
                  <h3 className="text-lg font-semibold text-gray-900">Turbo Mode</h3>
                  <div className="bg-[#4f46e5] text-white text-xs px-2 py-1 rounded-full mt-1">Recommended</div>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 4x processing speed</li>
                  <li>• Double GPU quota</li>
                  <li>• ~15 seconds completion</li>
                  <li>• High-performance GPUs</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 opacity-60">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center text-white font-bold mx-auto mb-2">Relax</div>
                  <h3 className="text-lg font-semibold text-gray-900">Relax Mode</h3>
                  <div className="bg-gray-400 text-white text-xs px-2 py-1 rounded-full mt-1">Not Available</div>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Slower processing</li>
                  <li>• Lower GPU quota</li>
                  <li>• Not supported</li>
                  <li>• Coming soon</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Requirements & Notes */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Requirements & Important Notes
              </h2>
              <p className="text-lg text-gray-600">
                Key information about using turbo mode effectively.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Requirements</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• <span className="font-semibold">Version Support:</span> V5 and above only</li>
                  <li>• <span className="font-semibold">Activation:</span> Use --turbo parameter</li>
                  <li>• <span className="font-semibold">GPU Quota:</span> Consumes double the normal amount</li>
                  <li>• <span className="font-semibold">Availability:</span> Depends on high-performance GPU pool</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-4">Important Notes</h3>
                <ul className="text-sm text-yellow-800 space-y-2">
                  <li>• <span className="font-semibold">Auto-fallback:</span> Downgrades to fast mode if turbo GPUs unavailable</li>
                  <li>• <span className="font-semibold">Experimental:</span> Feature availability may change</li>
                  <li>• <span className="font-semibold">Billing:</span> Pricing structure may be adjusted</li>
                  <li>• <span className="font-semibold">Performance:</span> Best for time-critical applications</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* API Integration */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                API Integration
              </h2>
              <p className="text-lg text-gray-600">
                Use turbo mode with our /diffusion API for maximum speed.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">API Example</h3>
              <div className="bg-gray-900 rounded p-4 mb-4">
                <pre className="text-green-400 text-sm overflow-x-auto">
{`curl --location 'https://api.legnext.ai/api/v1/diffusion' \\
--header 'x-api-key: YOUR_API_KEY' \\
--header 'Content-Type: application/json' \\
--data '{
    "text": "A beautiful landscape --turbo --v 6",
    "callback": "https://your-domain.com/webhook"
}'`}
                </pre>
              </div>
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <h4 className="font-semibold text-green-900 mb-2">Best Practices</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Use --turbo for time-critical applications</li>
                  <li>• Combine with --v 6 or higher for best results</li>
                  <li>• Monitor GPU quota consumption (2x normal rate)</li>
                  <li>• Have fallback logic for when turbo is unavailable</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-[#4f46e5] to-[#4f46e5]/80 rounded-lg p-8 text-center text-white">
              <h2 className="text-2xl font-bold mb-4">
                Ready for Ultra-Fast Generation?
              </h2>
              <p className="text-lg mb-6 opacity-90">
                Start using turbo mode with our API today.
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

export default Turbo;
