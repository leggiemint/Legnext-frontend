import MainLayout from "@/components/MainLayout";
import { getSEOTags } from "@/libs/seo";

export const metadata = getSEOTags({
  title: "Terms of Service | PNGTuberMaker - Avatar Creation Platform",
  description: "PNGTuberMaker Terms of Service - Learn about our service terms, usage policies, and user responsibilities for the PNGTuber avatar creation platform. Clear guidelines for streamers and content creators.",
  keywords: "pngtubermaker terms of service, pngtuber legal terms, avatar creation terms, streaming avatar policy, vtuber maker terms, pngtuber usage policy",
  canonicalUrlRelative: "/terms",
});

const Terms = () => {
  return (
    <MainLayout>
    <main className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Terms of <span className="bg-gradient-to-r from-[#06b6d4] to-[#0891b2] bg-clip-text text-transparent">Service</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-4">
            Please read these Terms of Service carefully before using PNGTuberMaker's services.
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
                    By accessing or using PNGTuberMaker's services ("Service"), operated by Dark Enlightenment Limited, you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, then you may not access the Service.
                  </p>
                  <p>
                    These Terms apply to all visitors, users, and others who access or use the Service.
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Description of Service</h2>
                <div className="text-gray-700 space-y-4">
                  <p>
                    PNGTuberMaker, operated by Dark Enlightenment Limited, provides an AI-powered platform that enables users to create custom PNGTuber avatars, including but not limited to:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>AI-generated avatar creation from text descriptions</li>
                    <li>Expression pack generation</li>
                    <li>Animation creation from static images</li>
                    <li>Image upscaling and variations</li>
                  </ul>
                  <p>
                    The Service is provided on an "as-is" and "as-available" basis.
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">3. User Accounts and Registration</h2>
                <div className="text-gray-700 space-y-4">
                  <p>
                    To access certain features of the Service, you must register for an account. You are responsible for:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Maintaining the confidentiality of your account credentials</li>
                    <li>All activities that occur under your account</li>
                    <li>Providing accurate and complete information during registration</li>
                    <li>Promptly updating your account information as needed</li>
                  </ul>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Acceptable Use Policy</h2>
                <div className="text-gray-700 space-y-4">
                  <p>You agree not to use the Service to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Generate harmful, illegal, or malicious content</li>
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe on intellectual property rights of others</li>
                    <li>Attempt to reverse engineer or bypass security measures</li>
                    <li>Use the Service for spam, fraud, or other deceptive practices</li>
                    <li>Overload or interfere with the Service's infrastructure</li>
                    <li>Share your account credentials with unauthorized parties</li>
                  </ul>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Avatar Generation and Usage Limits</h2>
                <div className="text-gray-700 space-y-4">
                  <p>
                    Your use of the avatar generation service is subject to usage quotas based on your subscription plan. We reserve the right to:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Modify usage limits and quotas with reasonable notice</li>
                    <li>Temporarily suspend access for excessive usage</li>
                    <li>Monitor usage for compliance and optimization purposes</li>
                  </ul>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Payment and Billing</h2>
                <div className="text-gray-700 space-y-4">
                  <p>
                    For paid services, you agree to pay all charges associated with your account. Billing terms include:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Charges are billed in advance or based on usage</li>
                    <li>All fees are non-refundable unless otherwise stated</li>
                    <li>We may change pricing with 30 days notice</li>
                    <li>Failure to pay may result in service suspension</li>
                  </ul>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Intellectual Property</h2>
                <div className="text-gray-700 space-y-4">
                  <p>
                    The Service and its original content, features, and functionality are owned by PNGTuberMaker and are protected by international copyright, trademark, and other intellectual property laws.
                  </p>
                  <p>
                    Avatars generated through the Service are subject to the terms and conditions of your subscription plan and may be used according to the license granted.
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Privacy and Data</h2>
                <div className="text-gray-700 space-y-4">
                  <p>
                    Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
                  </p>
                  <p>
                    We may collect and use technical information about your use of the Service to improve and optimize our avatar generation capabilities.
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">9. Service Availability</h2>
                <div className="text-gray-700 space-y-4">
                  <p>
                    While we strive for high availability, we do not guarantee that the Service will be available at all times. Service availability may be affected by:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Scheduled maintenance</li>
                    <li>Technical issues with AI model providers</li>
                    <li>Network or infrastructure problems</li>
                    <li>Force majeure events</li>
                  </ul>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">10. Limitation of Liability</h2>
                <div className="text-gray-700 space-y-4">
                  <p>
                    To the maximum extent permitted by law, PNGTuberMaker shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.
                  </p>
                  <p>
                    Our total liability for any claims shall not exceed the amount paid by you for the Service during the 12 months preceding the claim.
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">11. Termination</h2>
                <div className="text-gray-700 space-y-4">
                  <p>
                    We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
                  </p>
                  <p>
                    You may terminate your account at any time by contacting us or through your account settings.
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">12. Changes to Terms</h2>
                <div className="text-gray-700 space-y-4">
                  <p>
                    We reserve the right to modify these Terms at any time. We will notify users of significant changes by email or through the Service. Your continued use of the Service after changes take effect constitutes acceptance of the new Terms.
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">13. Contact Information</h2>
                <div className="text-gray-700 space-y-4">
                  <p>
                    If you have any questions about these Terms of Service, please contact us at:
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <p><strong>Company:</strong> Dark Enlightenment Limited</p>
                    <p><strong>Email:</strong> legal@pngtubermaker.com</p>
                    <p><strong>Address:</strong> 1111B S Governors Ave STE 26728<br />Dover, DE 19904 US</p>
                  </div>
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
