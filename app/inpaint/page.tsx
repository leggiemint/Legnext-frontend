import MainLayout from "@/components/MainLayout";
import { getSEOTags } from "@/libs/seo";

export const metadata = getSEOTags({
  title: "Midjourney Inpaint | AI Image Editing API",
  description: "Learn about Midjourney's inpaint functionality and how to use our /inpaint API to repaint specific regions in images.",
  keywords: ["midjourney inpaint", "ai image editing", "image repaint", "midjourney api", "mask editing"],
  canonical: "/inpaint",
});

const Inpaint = () => {
  return (
    <MainLayout>
      <main className="min-h-screen pt-24 pb-20">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Midjourney <span className="bg-gradient-to-r from-[#4f46e5] to-[#4f46e5]/80 bg-clip-text text-transparent">Inpaint</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Repaint or modify specific regions within existing images using mask-based editing with our /inpaint API.
            </p>
          </div>
        </section>

        {/* What is Inpaint */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              What is <span className="text-[#4f46e5]">Inpaint</span>?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Select specific areas in an image and repaint them with new content while keeping the rest unchanged.
            </p>
          </div>
        </section>

        {/* API Integration */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Use <span className="text-[#4f46e5]">/inpaint</span> API
              </h2>
              <p className="text-lg text-gray-600">
                Integrate Midjourney&apos;s inpaint functionality directly into your applications.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">API Example</h3>
              <div className="bg-gray-900 rounded p-4 mb-4">
                <pre className="text-green-400 text-sm overflow-x-auto">
{`curl --location 'https://api.legnext.ai/api/v1/inpaint' \\
--header 'x-api-key: YOUR_API_KEY' \\
--header 'Content-Type: application/json' \\
--data '{
    "jobId": "job_12345",
    "imageNo": 0,
    "remixPrompt": "Replace with a blooming flower",
    "mask": {
        "areas": [{
            "width": 1024,
            "height": 1024,
            "points": [288, 288, 408, 288, 408, 408, 288, 408]
        }]
    },
    "callback": "https://your-domain.com/webhook"
}'`}
                </pre>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <h4 className="font-semibold text-blue-900 mb-2">Parameters</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li><span className="font-mono">jobId</span>: Original image generation task ID</li>
                    <li><span className="font-mono">imageNo</span>: Image number to edit (0-3)</li>
                    <li><span className="font-mono">mask</span>: Regions to repaint (polygon or URL)</li>
                    <li><span className="font-mono">remixPrompt</span>: Text prompt for repaint area</li>
                    <li><span className="font-mono">callback</span>: Webhook URL</li>
                  </ul>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <h4 className="font-semibold text-green-900 mb-2">Response</h4>
                  <p className="text-sm text-green-800">Returns job ID, status, and up to 4 inpainted image URLs</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Mask Methods</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded p-3">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-[#4f46e5] rounded flex items-center justify-center text-white text-sm font-bold mr-2">1</div>
                      <span className="font-semibold text-gray-900">Polygon Areas</span>
                    </div>
                    <p className="text-sm text-gray-600">Define repaint areas using polygon coordinates</p>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-[#4f46e5] rounded flex items-center justify-center text-white text-sm font-bold mr-2">2</div>
                      <span className="font-semibold text-gray-900">Mask Image</span>
                    </div>
                    <p className="text-sm text-gray-600">Upload black and white mask image (white areas repainted)</p>
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
                Ready to Edit Images?
              </h2>
              <p className="text-lg mb-6 opacity-90">
                Get started with our /inpaint API today.
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

export default Inpaint;
