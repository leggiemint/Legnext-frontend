import MainLayout from "@/components/MainLayout";
import { getSEOTags } from "@/libs/seo";
import Link from "next/link";
import PricingSection from "@/components/PricingSection";

export const metadata = getSEOTags({
  title: "PNGTuber Maker Pricing | Affordable Plans for Streamers",
  description: "Choose the perfect plan for your streaming journey. Free trial plan for testing, Pro plan for serious creators. Start creating PNGTuber avatars today.",
  keywords: "pngtuber pricing, pngtuber generator cost, pngtuber subscription, streaming avatar plans, vtuber maker pricing, ai pngtuber cost",
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
                Need something <span className="bg-gradient-to-r from-[#06b6d4] to-[#06b6d4]/80 bg-clip-text text-transparent">custom</span>?
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Large agencies, VTuber companies, and streaming platforms need custom solutions. We offer white-label integrations, API access, and bulk pricing for your organization.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                  href="/contact" 
                  className="bg-[#06b6d4] hover:bg-[#06b6d4]/80 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
                >
                  Contact Sales
                </Link>
                <a 
                  href="mailto:enterprise@pngtubermaker.com" 
                  className="text-[#06b6d4] hover:underline font-medium"
                >
                  enterprise@pngtubermaker.com
                </a>
              </div>
            </div>
          </div>
        </section>
        
        {/* Pricing FAQ */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Pricing <span className="bg-gradient-to-r from-[#06b6d4] to-[#06b6d4]/80 bg-clip-text text-transparent">FAQ</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Common questions about PNGTuber pricing and plans
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto">
              <div className="space-y-6">
                
                {/* FAQ Item 1 */}
                <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Can I upgrade from Free to Pro anytime?
                  </h3>
                  <p className="text-gray-600">
                    Absolutely! You can upgrade from the Free plan to Pro at any time. Changes take effect immediately, and we'll adjust your billing accordingly.
                  </p>
                </div>
                
                {/* FAQ Item 2 */}
                <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    What happens if I exceed my generation limit?
                  </h3>
                  <p className="text-gray-600">
                    Your avatar generations will be paused until the next billing cycle. You can upgrade to Pro to get 100 generations per month and continue creating avatars without interruption.
                  </p>
                </div>
                
                {/* FAQ Item 3 */}
                <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Does the Pro plan include a free trial?
                  </h3>
                  <p className="text-gray-600">
                    Yes! The Pro plan includes a 7-day free trial. No credit card required to start - just sign up and begin creating avatars with all Pro features.
                  </p>
                </div>
                
                {/* FAQ Item 4 */}
                <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    What's your refund policy?
                  </h3>
                  <p className="text-gray-600">
                    We offer a 14-day money-back guarantee for the Pro plan. If you're not satisfied with your avatar results, contact our support team for a full refund.
                  </p>
                </div>
                
                {/* FAQ Item 5 */}
                <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    What payment methods are accepted?
                  </h3>
                  <p className="text-gray-600">
                    We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and various regional payment methods. All payments are processed securely through our payment partner.
                  </p>
                </div>
                
              </div>
            </div>
          </div>
        </section>
        
      </main>
    </MainLayout>
  );
};

export default Pricing;
