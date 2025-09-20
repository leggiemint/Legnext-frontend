import MainLayout from "@/components/layout/MainLayout";
import { getSEOTags } from "@/libs/seo";
// 静态内容页面，可以缓存
// export const dynamic = 'force-dynamic';

export const metadata = getSEOTags({
  title: "Refund Policy | Legnext - Service Terms and Conditions",
  description: "Legnext refund policy and service terms. Learn about our no-refund policy and service conditions for our AI API integration platform.",
  keywords: ["legnext refund policy", "no refund policy", "service terms", "api service conditions"],
  canonical: "/refund-policy",
});

const RefundPolicy = () => {
  return (
    <MainLayout>
      <main className="min-h-screen pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-[#4f46e5] to-[#0891b2] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Refund Policy
              </h1>
              
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Please review our refund policy and service terms before making a purchase.
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8">
              <p className="text-gray-600 mb-8"><strong>Last updated:</strong> January 2025</p>

              <div className="space-y-8">
                {/* No Refund Policy */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">No Refund Policy</h2>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                    <p className="text-red-800 font-medium">
                      <strong>All sales are final.</strong> We do not offer refunds, exchanges, or credits for any purchases made through our platform.
                    </p>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    By purchasing our services, you acknowledge and agree that all transactions are final. This policy applies to all services, subscriptions, credits, and digital products offered by Legnext.
                  </p>
                </section>

                {/* Service Terms */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Terms</h2>
                  <div className="text-gray-700 space-y-4">
                    <p>Our services are provided as-is. We strive to maintain high service quality, but we do not guarantee specific outcomes or results.</p>
                    <ul className="list-disc list-inside ml-4 space-y-2">
                      <li>Services are delivered immediately upon purchase</li>
                      <li>API credits and subscriptions are non-transferable</li>
                      <li>Service availability may vary based on third-party providers</li>
                      <li>We reserve the right to modify or discontinue services</li>
                    </ul>
                  </div>
                </section>

                {/* Billing Errors */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Billing Errors</h2>
                  <div className="text-gray-700 space-y-4">
                    <p>If you believe there has been a billing error, please contact us immediately at <a href="mailto:support@legnext.ai" className="text-[#4f46e5] hover:underline">support@legnext.ai</a>.</p>
                    <p>We will investigate legitimate billing errors and correct them if verified. This is the only exception to our no-refund policy.</p>
                  </div>
                </section>

                {/* Service Issues */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Issues</h2>
                  <div className="text-gray-700 space-y-4">
                    <p>If you experience technical issues with our services, please contact our support team. We will work to resolve any legitimate service problems, but this does not entitle you to a refund.</p>
                    <p>We may provide service credits or extensions at our sole discretion for verified technical issues.</p>
                  </div>
                </section>

                {/* Contact */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact</h2>
                  <div className="text-gray-700 space-y-4">
                    <p>For questions about this policy or our services, please contact us at <a href="mailto:support@legnext.ai" className="text-[#4f46e5] hover:underline">support@legnext.ai</a>.</p>
                  </div>
                </section>

                {/* Policy Changes */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Policy Updates</h2>
                  <div className="text-gray-700 space-y-4">
                    <p>We may update this policy from time to time. Changes will be posted on this page with an updated date. Continued use of our services constitutes acceptance of any changes.</p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
    </MainLayout>
  );
};

export default RefundPolicy;
