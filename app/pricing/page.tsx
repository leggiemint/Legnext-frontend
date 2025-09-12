import MainLayout from "@/components/MainLayout";
import { getSEOTags } from "@/libs/seo";
import PricingSection from "@/components/PricingSection";

export const metadata = getSEOTags({
  title: "Legnext Midjourney API Pricing | Professional AI Image Generation",
  description: "Choose the perfect plan for your AI image generation needs. Free tier for testing, Pro plan for developers and businesses. Start using Midjourney API today.",
  keywords: ["midjourney api pricing", "ai image generation cost", "midjourney subscription", "api access plans", "professional midjourney api", "midjourney integration pricing"],
  canonical: "/pricing",
});

const Pricing = () => {
  return (
    <MainLayout>
      <main className="min-h-screen pt-24 pb-20">
        
        {/* Pricing Section */}
        <PricingSection />
        
        {/* Pricing Table Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Task Points Consumption
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Different tasks consume different amounts of points. Choose the mode that fits your needs and budget.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Task Type</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Fast Mode</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Turbo Mode</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Draft in Fast Mode</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Draft in Turbo Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">Standard Generation</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">80</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">160</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">40</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">80</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">Strong Variation</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">120</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">240</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">Light Variation</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">120</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">240</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">Creative Upscale</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">160</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">320</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">Standard Upscale</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">120</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">240</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">Inpaint</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">120</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">240</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">Remix</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">120</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">240</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">Zoom</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">80</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">160</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">Pan</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">80</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">160</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">Advanced Edit</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">120</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">240</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">Style Transfer</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">120</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">240</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">Remove Background</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">80</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">160</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">Edit</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">120</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">240</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">Outpaint</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">80</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">160</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">Enhance</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">80</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">160</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    </tr>
                    <tr className="hover:bg-gray-50 bg-blue-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 font-semibold">Image to Video (480p)</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600 font-semibold">480</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600 font-semibold">960</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    </tr>
                    <tr className="hover:bg-gray-50 bg-blue-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 font-semibold">Image to Video (720p)</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600 font-semibold">1536</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600 font-semibold">3072</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    </tr>
                    <tr className="hover:bg-gray-50 bg-blue-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 font-semibold">Video Extension (480p)</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600 font-semibold">480</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600 font-semibold">960</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    </tr>
                    <tr className="hover:bg-gray-50 bg-blue-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 font-semibold">Video Extension (720p)</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600 font-semibold">1536</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600 font-semibold">3072</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    </tr>
                    <tr className="hover:bg-gray-50 bg-blue-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 font-semibold">Video Upscale</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600 font-semibold">480</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600 font-semibold">960</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-semibold">Note:</span> Draft modes are only available for V7 tasks. 
                Video tasks are highlighted in blue and require higher point consumption.
              </p>
              <p className="text-sm text-gray-500">
                Points are consumed based on the complexity and processing requirements of each task.
              </p>
            </div>
          </div>
        </section>
        
        {/* Enterprise CTA */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 backdrop-blur-sm border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Need something <span className="bg-gradient-to-r from-[#4f46e5] to-[#4f46e5]/80 bg-clip-text text-transparent">custom</span>?
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Large enterprises, agencies, and development teams need custom solutions. We offer white-label integrations, dedicated API access, and bulk pricing for your organization.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a 
                  href="mailto:support@legnext.ai" 
                  className="bg-[#4f46e5] hover:bg-[#4f46e5]/80 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
                >
                  Contact Sales
                </a>
                <a 
                  href="mailto:enterprise@legnext.ai" 
                  className="text-[#4f46e5] hover:underline font-medium"
                >
                  enterprise@legnext.ai
                </a>
              </div>
            </div>
          </div>
        </section>

        
      </main>
    </MainLayout>
  );
};

export default Pricing;
