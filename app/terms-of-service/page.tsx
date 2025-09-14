import MainLayout from "@/components/MainLayout";
import { getSEOTags } from "@/libs/seo";

export const dynamic = 'force-dynamic';


export const metadata = getSEOTags({
  title: "Terms of Service | Legnext - Service Terms and Conditions",
  description: "Legnext Terms of Service - Learn about our service terms, usage policies, and user responsibilities for our AI API platform.",
  keywords: ["legnext terms of service", "service terms", "usage policy", "terms and conditions"],
  canonical: "/terms-of-service",
});

const Terms = () => {
  return (
    <MainLayout>
    <main className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Terms of <span className="bg-gradient-to-r from-[#4f46e5] to-[#0891b2] bg-clip-text text-transparent">Service</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-4">
            Please read these Terms of Service carefully before using Legnext&apos;s services.
          </p>
          <p className="text-sm text-gray-500">
            Last updated: January 2025
          </p>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white backdrop-blur-sm rounded-2xl p-8 lg:p-12 border border-gray-200 shadow-sm">
            <div className="prose prose-lg max-w-none">
              
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Acceptance of Terms</h2>
                <div className="text-gray-700 space-y-4">
                  <p>
                    By using Legnext&apos;s services, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not use our services.
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Service Description</h2>
                <div className="text-gray-700 space-y-4">
                  <p>
                    Legnext provides AI API integration services. Our services are provided on an &quot;as-is&quot; and &quot;as-available&quot; basis without warranties of any kind.
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">3. User Responsibilities</h2>
                <div className="text-gray-700 space-y-4">
                  <p>You are responsible for:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Maintaining the security of your account</li>
                    <li>All activities under your account</li>
                    <li>Providing accurate information</li>
                    <li>Complying with all applicable laws</li>
                  </ul>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Acceptable Use</h2>
                <div className="text-gray-700 space-y-4">
                  <p>You agree not to use our services to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Generate illegal, harmful, or malicious content</li>
                    <li>Violate any laws or regulations</li>
                    <li>Infringe on intellectual property rights</li>
                    <li>Attempt to reverse engineer our systems</li>
                    <li>Use our services for spam or fraud</li>
                  </ul>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Payment Terms</h2>
                <div className="text-gray-700 space-y-4">
                  <p>
                    For paid services, you agree to pay all charges. All fees are non-refundable. We may change pricing with notice. Failure to pay may result in service suspension.
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Intellectual Property</h2>
                <div className="text-gray-700 space-y-4">
                  <p>
                    Our services and content are protected by intellectual property laws. You may not copy, modify, or distribute our services without permission.
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Privacy</h2>
                <div className="text-gray-700 space-y-4">
                  <p>
                    Your privacy is important to us. Please review our Privacy Policy to understand how we collect and use your information.
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Service Availability</h2>
                <div className="text-gray-700 space-y-4">
                  <p>
                    We do not guarantee that our services will be available at all times. Service may be interrupted for maintenance, technical issues, or other reasons.
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">9. Limitation of Liability</h2>
                <div className="text-gray-700 space-y-4">
                  <p>
                    To the maximum extent permitted by law, we shall not be liable for any damages resulting from your use of our services. Our total liability shall not exceed the amount you paid for our services.
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">10. Termination</h2>
                <div className="text-gray-700 space-y-4">
                  <p>
                    We may terminate your account for violations of these terms. You may terminate your account at any time by contacting us.
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">11. Changes to Terms</h2>
                <div className="text-gray-700 space-y-4">
                  <p>
                    We may modify these terms at any time. Continued use of our services after changes constitutes acceptance of the new terms.
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">12. Contact</h2>
                <div className="text-gray-700 space-y-4">
                  <p>
                    For questions about these terms, please contact us at <a href="mailto:support@legnext.ai" className="text-[#4f46e5] hover:underline">support@legnext.ai</a>.
                  </p>
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

export default Terms;
