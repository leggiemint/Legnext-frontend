import MainLayout from "@/components/MainLayout";
import { getSEOTags } from "@/libs/seo";
import Image from "next/image";

export const metadata = getSEOTags({
  title: "Midjourney /imagine Command | AI Image Generation API",
  description: "Learn about Midjourney's /imagine command and how to use our /diffusion API to generate stunning AI images. Complete guide with examples and integration code.",
  keywords: "midjourney imagine command, ai image generation, diffusion api, midjourney api, image generation tutorial, ai art creation",
  canonicalUrlRelative: "/imagine",
});

const Imagine = () => {
  return (
    <MainLayout>
      <main className="min-h-screen pt-24 pb-20">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Midjourney <span className="bg-gradient-to-r from-[#4f46e5] to-[#4f46e5]/80 bg-clip-text text-transparent">/imagine</span> Command
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Master the most powerful AI image generation command and learn how to integrate it into your applications using our /diffusion API.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="#api-integration" 
                  className="bg-[#4f46e5] hover:bg-[#4f46e5]/80 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
                >
                  Try API Integration
                </a>
                <a 
                  href="#examples" 
                  className="border border-[#4f46e5] text-[#4f46e5] hover:bg-[#4f46e5] hover:text-white font-semibold px-8 py-3 rounded-lg transition-colors"
                >
                  View Examples
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* What is /imagine Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  What is the <span className="text-[#4f46e5]">/imagine</span> Command?
                </h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  The <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">/imagine</code> command is Midjourney's core functionality for generating AI images from text prompts. It's the foundation of Midjourney's image generation capabilities and the most widely used command in the platform.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-[#4f46e5] rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Text-to-Image Generation</h3>
                      <p className="text-gray-600">Convert descriptive text prompts into stunning visual artwork</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-[#4f46e5] rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Advanced Parameters</h3>
                      <p className="text-gray-600">Control aspect ratio, style, quality, and other generation parameters</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-[#4f46e5] rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Multiple Variations</h3>
                      <p className="text-gray-600">Generate multiple variations and upscale options for each prompt</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Basic Usage</h3>
                <div className="bg-gray-900 rounded-lg p-4 mb-4">
                  <code className="text-green-400 text-sm">
                    /imagine prompt: A beautiful sunset over snow-capped mountains --v 6 --ar 16:9
                  </code>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-semibold">prompt:</span> Your descriptive text</p>
                  <p><span className="font-semibold">--v 6:</span> Midjourney version 6</p>
                  <p><span className="font-semibold">--ar 16:9:</span> 16:9 aspect ratio</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* API Integration Section */}
        <section id="api-integration" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Use <span className="text-[#4f46e5]">/diffusion</span> API for Same Power
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Integrate Midjourney's /imagine functionality directly into your applications using our /diffusion API endpoint. No Midjourney account required.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* API Example */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">API Integration Example</h3>
                <div className="bg-gray-900 rounded-lg p-6 mb-6">
                  <pre className="text-green-400 text-sm overflow-x-auto">
{`curl --location 'http://fi.ifine.eu:9901/api/v1/diffusion' \\
--header 'x-api-key: 66f01870fd40f3dbc27fea77e6f1e623cbf732a87078cac48eeedac0a383ab97' \\
--header 'Content-Type: application/json' \\
--data '{
    "text": "A beautiful sunset over the snow mountains --v 7",
    "callback": "https://webhook.site/c98cb890-fb92-439f-8d60-42c8a51eb52d"
}'`}
                  </pre>
                </div>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Request Parameters</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li><span className="font-mono">text</span>: Your prompt with Midjourney parameters</li>
                      <li><span className="font-mono">callback</span>: Webhook URL for async results</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">Response</h4>
                    <p className="text-sm text-green-800">Returns job ID and status for tracking generation progress</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#4f46e5] rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Lightning Fast</h4>
                      <p className="text-gray-600">Generate images in seconds with our optimized infrastructure</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#4f46e5] rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Reliable & Scalable</h4>
                      <p className="text-gray-600">99.9% uptime with enterprise-grade infrastructure</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#4f46e5] rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Full Midjourney Compatibility</h4>
                      <p className="text-gray-600">Support for all Midjourney parameters and versions</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#4f46e5] rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Easy Integration</h4>
                      <p className="text-gray-600">Simple REST API with comprehensive documentation</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Examples Section */}
        <section id="examples" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Popular <span className="text-[#4f46e5]">/imagine</span> Use Cases
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Discover the most effective ways to use the /imagine command for different types of content creation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Example 1 */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <div className="bg-gray-900 rounded-lg p-4 mb-4">
                  <code className="text-green-400 text-sm">
                    /imagine prompt: A futuristic city skyline at sunset, cyberpunk style --v 6 --ar 16:9
                  </code>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Digital Art & Concept Art</h3>
                <p className="text-gray-600 text-sm">Perfect for creating concept art, digital illustrations, and artistic compositions.</p>
              </div>

              {/* Example 2 */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <div className="bg-gray-900 rounded-lg p-4 mb-4">
                  <code className="text-green-400 text-sm">
                    /imagine prompt: Professional headshot of a businesswoman, corporate style --v 6 --ar 1:1
                  </code>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Professional Photography</h3>
                <p className="text-gray-600 text-sm">Generate professional-looking photos for marketing, websites, and presentations.</p>
              </div>

              {/* Example 3 */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <div className="bg-gray-900 rounded-lg p-4 mb-4">
                  <code className="text-green-400 text-sm">
                    /imagine prompt: Product mockup of a modern smartphone, studio lighting --v 6 --ar 4:3
                  </code>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Product Visualization</h3>
                <p className="text-gray-600 text-sm">Create product mockups and visualizations for e-commerce and marketing.</p>
              </div>

              {/* Example 4 */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <div className="bg-gray-900 rounded-lg p-4 mb-4">
                  <code className="text-green-400 text-sm">
                    /imagine prompt: Children's book illustration, cute animals in a forest --v 6 --ar 3:4
                  </code>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Children's Content</h3>
                <p className="text-gray-600 text-sm">Generate illustrations for children's books, educational content, and family-friendly media.</p>
              </div>

              {/* Example 5 */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <div className="bg-gray-900 rounded-lg p-4 mb-4">
                  <code className="text-green-400 text-sm">
                    /imagine prompt: Architectural visualization of a modern house, exterior view --v 6 --ar 16:9
                  </code>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Architecture & Design</h3>
                <p className="text-gray-600 text-sm">Create architectural visualizations and design concepts for real estate and construction.</p>
              </div>

              {/* Example 6 */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <div className="bg-gray-900 rounded-lg p-4 mb-4">
                  <code className="text-green-400 text-sm">
                    /imagine prompt: Fantasy landscape with dragons and castles, epic style --v 6 --ar 21:9
                  </code>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Gaming & Entertainment</h3>
                <p className="text-gray-600 text-sm">Generate assets for games, movies, and entertainment content.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Parameters Guide */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Essential <span className="text-[#4f46e5]">Parameters</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Master the most important parameters to get the best results from your /imagine prompts.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Aspect Ratio (--ar)</h3>
                  <p className="text-gray-600 mb-4">Control the dimensions of your generated image.</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <code className="bg-gray-100 px-2 py-1 rounded">--ar 1:1</code>
                      <span className="text-gray-600">Square (1024x1024)</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="bg-gray-100 px-2 py-1 rounded">--ar 16:9</code>
                      <span className="text-gray-600">Widescreen (1920x1080)</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="bg-gray-100 px-2 py-1 rounded">--ar 3:4</code>
                      <span className="text-gray-600">Portrait (768x1024)</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="bg-gray-100 px-2 py-1 rounded">--ar 21:9</code>
                      <span className="text-gray-600">Ultrawide (2560x1080)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Version (--v)</h3>
                  <p className="text-gray-600 mb-4">Choose the Midjourney model version for generation.</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <code className="bg-gray-100 px-2 py-1 rounded">--v 6</code>
                      <span className="text-gray-600">Latest stable version</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="bg-gray-100 px-2 py-1 rounded">--v 7</code>
                      <span className="text-gray-600">Newest features</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="bg-gray-100 px-2 py-1 rounded">--v 5.2</code>
                      <span className="text-gray-600">Previous stable</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Quality (--q)</h3>
                  <p className="text-gray-600 mb-4">Control the quality and detail level of generation.</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <code className="bg-gray-100 px-2 py-1 rounded">--q 0.5</code>
                      <span className="text-gray-600">Faster, less detailed</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="bg-gray-100 px-2 py-1 rounded">--q 1</code>
                      <span className="text-gray-600">Default quality</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="bg-gray-100 px-2 py-1 rounded">--q 2</code>
                      <span className="text-gray-600">Higher quality</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Style (--style)</h3>
                  <p className="text-gray-600 mb-4">Apply different artistic styles to your images.</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <code className="bg-gray-100 px-2 py-1 rounded">--style raw</code>
                      <span className="text-gray-600">Less stylized</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="bg-gray-100 px-2 py-1 rounded">--style cute</code>
                      <span className="text-gray-600">Cute, friendly style</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="bg-gray-100 px-2 py-1 rounded">--style scenic</code>
                      <span className="text-gray-600">Landscape focused</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-[#4f46e5] to-[#4f46e5]/80 rounded-2xl p-12 text-center text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Start Generating?
              </h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Integrate Midjourney's /imagine functionality into your applications today. Get started with our /diffusion API in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/pricing" 
                  className="bg-white text-[#4f46e5] hover:bg-gray-100 font-semibold px-8 py-3 rounded-lg transition-colors"
                >
                  View Pricing
                </a>
                <a 
                  href="https://docs.legnext.ai/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-white text-white hover:bg-white hover:text-[#4f46e5] font-semibold px-8 py-3 rounded-lg transition-colors"
                >
                  Read Documentation
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
