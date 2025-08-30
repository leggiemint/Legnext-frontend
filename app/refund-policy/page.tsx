import MainLayout from "@/components/MainLayout";
import { getSEOTags } from "@/libs/seo";
import Link from "next/link";

export const metadata = getSEOTags({
  title: "Refund Policy | PNGTuberMaker - Fair and Transparent Refund Terms",
  description: "PNGTuberMaker's refund policy ensures customer satisfaction. Learn about our refund terms, conditions, and how to request refunds for our AI avatar creation services.",
  keywords: "pngtubermaker refund policy, refund terms, money back guarantee, customer satisfaction, ai avatar refund",
  canonicalUrlRelative: "/refund-policy",
});

const RefundPolicy = () => {
  return (
    <MainLayout>
      <main className="min-h-screen pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-[#06b6d4] to-[#0891b2] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Refund Policy
              </h1>
              
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We&apos;re committed to your satisfaction. Here&apos;s our transparent refund policy for PNGTuberMaker services.
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8">
              <p className="text-gray-600 mb-8"><strong>Last updated:</strong> December 2024</p>

              <div className="space-y-8">
                {/* Company Information */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Company Information</h2>
                  <div className="bg-blue-50 rounded-lg p-6 mb-6">
                    <p className="text-blue-900 font-medium mb-2">Service Provider</p>
                    <p className="text-blue-700">
                      PNGTuberMaker is operated by <strong>Dark Enlightenment Limited</strong>, a limited liability company committed to providing transparent and fair business practices.
                    </p>
                  </div>
                </section>

                {/* Overview */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
                  <p className="text-gray-700 leading-relaxed">
                    Dark Enlightenment Limited, operating PNGTuberMaker, strives to provide high-quality AI-generated avatar creation services. We understand that sometimes our service may not meet your expectations, and we&apos;re committed to resolving any issues fairly and transparently.
                  </p>
                </section>

                {/* Refund Eligibility */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Refund Eligibility</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">You may be eligible for a refund in the following circumstances:</p>
                  
                  <div className="bg-gray-50 rounded-lg p-6 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">✅ Valid Refund Reasons:</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start">
                        <span className="text-[#06b6d4] mr-2">•</span>
                        <span><strong>Technical Issues:</strong> Service fails to generate avatars due to technical problems on our end</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#06b6d4] mr-2">•</span>
                        <span><strong>Payment Errors:</strong> Duplicate charges or billing errors</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#06b6d4] mr-2">•</span>
                        <span><strong>Service Unavailable:</strong> Purchased service becomes permanently unavailable</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#06b6d4] mr-2">•</span>
                        <span><strong>Quality Issues:</strong> Generated avatars significantly deviate from service description (within 7 days)</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-red-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-red-900 mb-3">❌ Non-Refundable Situations:</h3>
                    <ul className="space-y-2 text-red-700">
                      <li className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        <span>Change of mind after successful avatar generation</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        <span>Minor variations in avatar style or appearance</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        <span>Downloaded avatars or completed services after 30 days</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        <span>Violation of our Terms of Service</span>
                      </li>
                    </ul>
                  </div>
                </section>

                {/* Refund Timeline */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Refund Timeline</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">Request Window</h3>
                      <p className="text-blue-700">Refund requests must be submitted within <strong>30 days</strong> of purchase for most issues, or within <strong>7 days</strong> for quality-related concerns.</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-green-900 mb-2">Processing Time</h3>
                      <p className="text-green-700">Approved refunds are processed within <strong>5-10 business days</strong> and will appear in your original payment method.</p>
                    </div>
                  </div>
                </section>

                {/* How to Request */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Request a Refund</h2>
                  <div className="space-y-4">
                    <div className="border-l-4 border-[#06b6d4] pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Contact Support</h3>
                      <p className="text-gray-700">Email us at <a href="mailto:support@pngtubermaker.com" className="text-[#06b6d4] hover:text-[#0891b2] underline">support@pngtubermaker.com</a> with your refund request.</p>
                    </div>
                    
                    <div className="border-l-4 border-[#06b6d4] pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 2: Provide Information</h3>
                      <p className="text-gray-700">Include your order number, purchase date, and detailed reason for the refund request.</p>
                    </div>
                    
                    <div className="border-l-4 border-[#06b6d4] pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 3: Review Process</h3>
                      <p className="text-gray-700">Our team will review your request within 2-3 business days and respond with a decision.</p>
                    </div>
                  </div>
                </section>

                {/* Partial Refunds */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Partial Refunds</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    In some cases, we may offer partial refunds based on service usage:
                  </p>
                  <ul className="space-y-2 text-gray-700 ml-6">
                    <li className="list-disc">Subscription services will be prorated based on unused time</li>
                    <li className="list-disc">Bundle packages may receive partial refunds for unused credits</li>
                    <li className="list-disc">Custom work may be partially refundable depending on completion stage</li>
                  </ul>
                </section>

                {/* Chargebacks */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Chargebacks and Disputes</h2>
                  <div className="bg-yellow-50 rounded-lg p-6">
                    <p className="text-yellow-800">
                      <strong>Please contact us first!</strong> Before initiating a chargeback with your bank or credit card company, please reach out to our support team. We&apos;re committed to resolving issues directly and chargebacks can result in additional fees and account restrictions.
                    </p>
                  </div>
                </section>

                {/* Contact Information */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Legal Entity</h3>
                    <div className="space-y-2 text-gray-700 mb-4">
                      <p><strong>Company:</strong> Dark Enlightenment Limited</p>
                      <p><strong>Service Brand:</strong> PNGTuberMaker</p>
                      <p><strong>Business Type:</strong> Limited Liability Company</p>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Support</h3>
                    <div className="space-y-2 text-gray-700">
                      <p><strong>Email:</strong> <a href="mailto:support@pngtubermaker.com" className="text-[#06b6d4] hover:text-[#0891b2] underline">support@pngtubermaker.com</a></p>
                      <p><strong>Response Time:</strong> Within 24 hours (business days)</p>
                      <p><strong>Business Hours:</strong> Monday - Friday, 9 AM - 6 PM EST</p>
                    </div>
                  </div>
                </section>

                {/* Policy Changes */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Policy Updates</h2>
                  <p className="text-gray-700 leading-relaxed">
                    We may update this refund policy from time to time. Any changes will be posted on this page with an updated &quot;Last modified&quot; date. Continued use of our services after policy changes constitutes acceptance of the new terms.
                  </p>
                </section>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center bg-gradient-to-r from-[#06b6d4] to-[#0891b2] rounded-2xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Have Questions About Our Refund Policy?</h2>
              <p className="text-lg opacity-90 mb-6">Our support team is here to help clarify any concerns.</p>
              <Link href="/contact" className="inline-flex items-center gap-2 bg-white text-[#06b6d4] hover:bg-gray-50 font-semibold px-8 py-3 rounded-lg transition-colors">
                Contact Support
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </MainLayout>
  );
};

export default RefundPolicy;
