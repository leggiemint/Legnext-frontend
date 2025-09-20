import MainLayout from "@/components/layout/MainLayout";
import { getSEOTags } from "@/libs/seo";

// 文档页面是静态内容，可以缓存
// export const dynamic = 'force-dynamic';

export const metadata = getSEOTags({
  title: "Midjourney Fast Mode | Speed Control for AI Image Generation",
  description: "Learn about Midjourney's fast mode for controlling GPU speed and task execution time in image generation.",
  keywords: ["midjourney fast mode", "gpu speed control", "fast image generation", "midjourney api", "speed modes"],
  canonical: "/fast",
});

const Fast = () => {
  return (
    <MainLayout>
      <main className="min-h-screen pt-24 pb-20">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Midjourney <span className="bg-gradient-to-r from-[#4f46e5] to-[#4f46e5]/80 bg-clip-text text-transparent">Fast Mode</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Control GPU speed and task execution time for optimal image generation performance.
            </p>
          </div>
        </section>

        {/* What is Fast Mode */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              What is <span className="text-[#4f46e5]">Fast Mode</span>?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Fast mode is the default GPU speed mode that prioritizes GPU resources for processing, typically completing image generation within 1 minute.
            </p>
          </div>
        </section>

        {/* Speed Modes */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Available Speed Modes
              </h2>
              <p className="text-lg text-gray-600">
                Our API provides different speed modes for various use cases.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-[#4f46e5] rounded-lg flex items-center justify-center text-white font-bold mr-3">Fast</div>
                  <h3 className="text-xl font-semibold text-gray-900">Fast Mode</h3>
                </div>
                <p className="text-gray-600 mb-4">Default GPU speed mode with priority processing</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Typically completes within 1 minute</li>
                  <li>• Activated with --fast parameter</li>
                  <li>• Priority GPU resource allocation</li>
                  <li>• Best for most use cases</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-[#4f46e5] rounded-lg flex items-center justify-center text-white font-bold mr-3">Turbo</div>
                  <h3 className="text-xl font-semibold text-gray-900">Turbo Mode</h3>
                </div>
                <p className="text-gray-600 mb-4">Ultra-fast processing for time-critical applications</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Fastest available processing</li>
                  <li>• Activated with --turbo parameter</li>
                  <li>• Maximum GPU resource allocation</li>
                  <li>• Ideal for real-time applications</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Factors Affecting Speed */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Factors Affecting Task Time
              </h2>
              <p className="text-lg text-gray-600">
                Several factors can influence the time required for image generation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Image Resolution</h3>
                  <p className="text-sm text-gray-600">Higher resolution images require more processing time</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Aspect Ratio</h3>
                  <p className="text-sm text-gray-600">Non-standard ratios may increase processing time</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Model Version</h3>
                  <p className="text-sm text-gray-600">Newer models are typically faster</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Task Type</h3>
                  <p className="text-sm text-gray-600">Generating variations or using lower quality settings reduces time</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Image Prompts</h3>
                  <p className="text-sm text-gray-600">Number of referenced images in prompts affects processing time</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">GPU Load</h3>
                  <p className="text-sm text-gray-600">Current system load and queue length impact wait times</p>
                </div>
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
                Use speed modes with our /diffusion API for optimal performance.
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
    "text": "A beautiful landscape --fast --v 6",
    "callback": "https://your-domain.com/webhook"
}'`}
                </pre>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Speed Parameters</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <span className="font-mono">--fast</span>: Default fast mode (1 minute typical)</li>
                  <li>• <span className="font-mono">--turbo</span>: Ultra-fast mode (faster processing)</li>
                  <li>• Speed modes work with all Midjourney versions</li>
                  <li>• Combine with other parameters for optimal results</li>
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
                Ready to Optimize Your Speed?
              </h2>
              <p className="text-lg mb-6 opacity-90">
                Start using speed modes with our API today.
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

export default Fast;
