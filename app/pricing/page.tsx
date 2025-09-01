import MainLayout from "@/components/MainLayout";
import { getSEOTags } from "@/libs/seo";
import PricingSection from "@/components/PricingSection";

export const metadata = getSEOTags({
  title: "Legnext Midjourney API Pricing | Professional AI Image Generation",
  description: "Choose the perfect plan for your AI image generation needs. Free tier for testing, Pro plan for developers and businesses. Start using Midjourney API today.",
  keywords: "midjourney api pricing, ai image generation cost, midjourney subscription, api access plans, professional midjourney api, midjourney integration pricing",
  canonicalUrlRelative: "/pricing",
});

const Pricing = () => {
  return (
    <MainLayout>
      <main className="min-h-screen pt-24 pb-20">
        
        {/* Pricing Section */}
        <PricingSection />
        
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
