import MainLayout from "@/components/MainLayout";
import { getSEOTags } from "@/libs/seo";

export const dynamic = 'force-dynamic';

export const metadata = getSEOTags({
  title: "Midjourney /imagine Command | AI Image Generation API",
  description: "Learn about Midjourney's /imagine command and how to use our /diffusion API to generate stunning AI images.",
  keywords: ["midjourney imagine command", "ai image generation", "diffusion api", "midjourney api"],
  canonical: "/imagine",
});

const Imagine = () => {
  return (
    <MainLayout>
      <main className="min-h-screen pt-24 pb-20">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Midjourney <span className="bg-gradient-to-r from-[#4f46e5] to-[#4f46e5]/80 bg-clip-text text-transparent">/imagine</span> Command
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Master AI image generation and integrate it into your applications using our /diffusion API.
            </p>
          </div>
        </section>

        {/* What is /imagine */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  What is <span className="text-[#4f46e5]">/imagine</span>?
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  The <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">/imagine</code> command is Midjourney&apos;s core functionality for generating AI images from text prompts.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-[#4f46e5] rounded-full"></div>
                    <span className="text-gray-600">Text-to-image generation</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-[#4f46e5] rounded-full"></div>
                    <span className="text-gray-600">Advanced parameters control</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-[#4f46e5] rounded-full"></div>
                    <span className="text-gray-600">Multiple variations</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Basic Usage</h3>
                <div className="bg-gray-900 rounded p-3 mb-4">
                  <code className="text-green-400 text-sm">
                    /imagine prompt: A beautiful sunset over mountains --v 6 --ar 16:9
                  </code>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-semibold">--v 6:</span> Midjourney version 6</p>
                  <p><span className="font-semibold">--ar 16:9:</span> 16:9 aspect ratio</p>
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
                Use <span className="text-[#4f46e5]">/diffusion</span> API
              </h2>
              <p className="text-lg text-gray-600">
                Integrate Midjourney&apos;s /imagine functionality directly into your applications.
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
    "text": "A beautiful sunset over the snow mountains --v 7",
    "callback": "https://webhook.site/c98cb890-fb92-439f-8d60-42c8a51eb52d"
}'`}
                </pre>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <h4 className="font-semibold text-blue-900 mb-2">Parameters</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li><span className="font-mono">text</span>: Your prompt</li>
                    <li><span className="font-mono">callback</span>: Webhook URL</li>
                  </ul>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <h4 className="font-semibold text-green-900 mb-2">Response</h4>
                  <p className="text-sm text-green-800">Returns job ID for tracking progress</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Examples */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Popular Use Cases
              </h2>
              <p className="text-lg text-gray-600">
                Common ways to use the /imagine command for different content types.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="bg-gray-900 rounded p-3 mb-3">
                  <code className="text-green-400 text-sm">
                    /imagine prompt: Futuristic city skyline, cyberpunk style --v 6 --ar 16:9
                  </code>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Digital Art</h3>
                <p className="text-gray-600 text-sm">Concept art and digital illustrations</p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="bg-gray-900 rounded p-3 mb-3">
                  <code className="text-green-400 text-sm">
                    /imagine prompt: Professional headshot, corporate style --v 6 --ar 1:1
                  </code>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Professional Photos</h3>
                <p className="text-gray-600 text-sm">Marketing and presentation images</p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="bg-gray-900 rounded p-3 mb-3">
                  <code className="text-green-400 text-sm">
                    /imagine prompt: Product mockup, modern smartphone --v 6 --ar 4:3
                  </code>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Product Visualization</h3>
                <p className="text-gray-600 text-sm">E-commerce and marketing mockups</p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="bg-gray-900 rounded p-3 mb-3">
                  <code className="text-green-400 text-sm">
                    /imagine prompt: Fantasy landscape, dragons and castles --v 6 --ar 21:9
                  </code>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Gaming Assets</h3>
                <p className="text-gray-600 text-sm">Game and entertainment content</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-[#4f46e5] to-[#4f46e5]/80 rounded-lg p-8 text-center text-white">
              <h2 className="text-2xl font-bold mb-4">
                Ready to Start Generating?
              </h2>
              <p className="text-lg mb-6 opacity-90">
                Get started with our /diffusion API today.
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

export default Imagine;
