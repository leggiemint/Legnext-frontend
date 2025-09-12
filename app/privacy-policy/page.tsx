import MainLayout from "@/components/MainLayout";
import { getSEOTags } from "@/libs/seo";

export const metadata = getSEOTags({
  title: "Privacy Policy | Legnext - AI API Privacy & Data Protection",
  description: "Legnext Privacy Policy - Learn how we collect, use, and protect your personal information when using our AI API integration platform.",
  keywords: ["legnext privacy policy", "ai api privacy", "data protection", "privacy policy"],
  canonical: "/privacy-policy",
});

const Privacy = () => {
  return (
    <MainLayout>
      <main className="min-h-screen pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Privacy <span className="bg-gradient-to-r from-[#4f46e5] to-[#0891b2] bg-clip-text text-transparent">Policy</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-4">
              We are committed to protecting your privacy and ensuring the security of your personal information.
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Information We Collect</h2>
                  <div className="text-gray-700 space-y-4">
                    <p>We collect information you provide directly to us, such as when you create an account, use our services, or contact us. This may include:</p>
                    <ul className="list-disc list-inside ml-4 space-y-2">
                      <li>Account information (email, username)</li>
                      <li>Usage data and API requests</li>
                      <li>Device and browser information</li>
                      <li>Content you submit through our services</li>
                    </ul>
                  </div>
                </section>

                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">2. How We Use Your Information</h2>
                  <div className="text-gray-700 space-y-4">
                    <p>We use the information we collect to:</p>
                    <ul className="list-disc list-inside ml-4 space-y-2">
                      <li>Provide, maintain, and improve our services</li>
                      <li>Process transactions and send related information</li>
                      <li>Send technical notices and support messages</li>
                      <li>Respond to your comments and questions</li>
                      <li>Monitor and analyze usage patterns</li>
                    </ul>
                  </div>
                </section>

                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">3. Information Sharing</h2>
                  <div className="text-gray-700 space-y-4">
                    <p>We do not sell, trade, or otherwise transfer your personal information to third parties except:</p>
                    <ul className="list-disc list-inside ml-4 space-y-2">
                      <li>With your consent</li>
                      <li>To comply with legal obligations</li>
                      <li>To protect our rights and prevent fraud</li>
                      <li>With service providers who assist in our operations</li>
                    </ul>
                  </div>
                </section>

                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Data Security</h2>
                  <div className="text-gray-700 space-y-4">
                    <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
                  </div>
                </section>

                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Cookies</h2>
                  <div className="text-gray-700 space-y-4">
                    <p>We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content. You can control cookies through your browser settings.</p>
                  </div>
                </section>

                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Data Retention</h2>
                  <div className="text-gray-700 space-y-4">
                    <p>We retain your information for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your account and associated data at any time.</p>
                  </div>
                </section>

                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Your Rights</h2>
                  <div className="text-gray-700 space-y-4">
                    <p>Depending on your location, you may have rights to access, update, or delete your personal information. You may also have the right to object to certain processing activities.</p>
                  </div>
                </section>

                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Children&apos;s Privacy</h2>
                  <div className="text-gray-700 space-y-4">
                    <p>Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>
                  </div>
                </section>

                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">9. Changes to This Policy</h2>
                  <div className="text-gray-700 space-y-4">
                    <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.</p>
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

export default Privacy;
