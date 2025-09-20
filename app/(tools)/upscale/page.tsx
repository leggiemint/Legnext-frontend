import MainLayout from "@/components/layout/MainLayout";
import { getSEOTags } from "@/libs/seo";

// 文档页面是静态内容，可以缓存
// export const dynamic = 'force-dynamic';

export const metadata = getSEOTags({
  title: "Midjourney Upscale | AI Image Enhancement API",
  description: "Learn about Midjourney's upscale functionality and how to use our /upscale API to enhance and enlarge AI-generated images.",
  keywords: ["midjourney upscale", "ai image enhancement", "image upscaling", "midjourney api", "image quality improvement"],
  canonical: "/upscale",
});

const Upscale = () => {
  return (
    <MainLayout>
      <main className="min-h-screen pt-24 pb-20">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Midjourney <span className="bg-gradient-to-r from-[#4f46e5] to-[#4f46e5]/80 bg-clip-text text-transparent">Upscale</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Enhance and enlarge your AI-generated images with professional quality upscaling using our /upscale API.
            </p>
          </div>
        </section>

        {/* What is Upscale */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              What is <span className="text-[#4f46e5]">Upscale</span>?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Upscaling enhances your generated images by increasing their resolution and improving quality.
            </p>
          </div>
        </section>

        {/* API Integration */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Use <span className="text-[#4f46e5]">/upscale</span> API
              </h2>
              <p className="text-lg text-gray-600">
                Integrate Midjourney&apos;s upscale functionality directly into your applications.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">API Example</h3>
              <div className="bg-gray-900 rounded p-4 mb-4">
                <pre className="text-green-400 text-sm overflow-x-auto">
{`curl --location 'https://api.legnext.ai/api/v1/upscale' \\
--header 'x-api-key: YOUR_API_KEY' \\
--header 'Content-Type: application/json' \\
--data '{
    "jobId": "280b8eb6-978f-446b-a87d-198caed8eabe",
    "imageNo": 4,
    "type": 0,
    "callback": "https://webhook.site/a334611b-cc33-4f5e-a865-9800f92f5551"
}'`}
                </pre>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <h4 className="font-semibold text-blue-900 mb-2">Parameters</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li><span className="font-mono">jobId</span>: Original generation job ID</li>
                    <li><span className="font-mono">imageNo</span>: Image number (1-4)</li>
                    <li><span className="font-mono">type</span>: Upscale type (0-3)</li>
                    <li><span className="font-mono">callback</span>: Webhook URL</li>
                  </ul>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <h4 className="font-semibold text-green-900 mb-2">Response</h4>
                  <p className="text-sm text-green-800">Returns job ID, status, and usage information for tracking progress</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">API Response Example</h4>
                <div className="bg-gray-900 rounded p-4">
                  <pre className="text-green-400 text-sm overflow-x-auto">
{`{
    "job_id": "2c76c546-40aa-4142-9ac1-bb30020f9f29",
    "model": "midjourney",
    "task_type": "upscale",
    "status": "pending",
    "config": {
        "service_mode": "public",
        "webhook_config": {
            "endpoint": "https://webhook.site/...",
            "secret": ""
        }
    },
    "output": {
        "image_url": "",
        "image_urls": null
    },
    "meta": {
        "created_at": "2025-09-10T15:21:05Z",
        "usage": {
            "type": "point",
            "frozen": 120,
            "consume": 0
        }
    }
}`}
                  </pre>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <p><span className="font-semibold">job_id:</span> Unique identifier for tracking the upscale job</p>
                  <p><span className="font-semibold">status:</span> Current job status (pending, processing, completed, failed)</p>
                  <p><span className="font-semibold">frozen:</span> Points reserved for this operation (120 points for upscale)</p>
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
                Ready to Enhance Your Images?
              </h2>
              <p className="text-lg mb-6 opacity-90">
                Get started with our /upscale API today.
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

export default Upscale;
