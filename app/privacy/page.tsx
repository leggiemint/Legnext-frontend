import MainLayout from "@/components/MainLayout";
import { getSEOTags } from "@/libs/seo";

export const metadata = getSEOTags({
  title: "Privacy Policy | PNGTuberMaker - Data Protection & Privacy",
  description: "PNGTuberMaker Privacy Policy - Learn how we collect, use, and protect your personal information when using our PNGTuber avatar creation platform. GDPR compliant data protection.",
  keywords: "pngtubermaker privacy policy, pngtuber data protection, avatar creation privacy, streaming avatar gdpr, pngtuber maker privacy, vtuber privacy policy",
  canonicalUrlRelative: "/privacy",
});

const Privacy = () => {
  return (
    <MainLayout>
      <main className="min-h-screen pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Privacy <span className="bg-gradient-to-r from-[#06b6d4] to-[#0891b2] bg-clip-text text-transparent">Policy</span>
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Introduction</h2>
                  <div className="text-gray-700 space-y-4">
                    <p>
                      This Privacy Policy describes how Dark Enlightenment Limited, operating PNGTuberMaker (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) collects, uses, and protects your information when you use our PNGTuber avatar creation platform (&quot;Service&quot;).
                    </p>
                    <p>
                      By using our Service, you agree to the collection and use of information in accordance with this Privacy Policy.
                    </p>
                  </div>
                </section>

                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Information We Collect</h2>
                  
                  <div className="text-gray-700 space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Personal Information</h3>
                      <p>We may collect the following personal information:</p>
                      <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                        <li>Name and email address</li>
                        <li>Company information</li>
                        <li>Billing and payment information</li>
                        <li>Account credentials and authentication data</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Usage Information</h3>
                      <p>We automatically collect information about how you use our Service:</p>
                      <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                        <li>Avatar generation patterns and frequency</li>
                        <li>Request and response metadata</li>
                        <li>Performance and error logs</li>
                        <li>Device and browser information</li>
                        <li>IP addresses and location data</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">2.3 Content Data</h3>
                      <p>
                        We may temporarily process content you submit through our Service for the purpose of providing avatar generation, including:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                        <li>Text descriptions and prompts</li>
                        <li>Generated avatar images</li>
                        <li>Uploaded reference files and images</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">3. How We Use Your Information</h2>
                  <div className="text-gray-700 space-y-4">
                    <p>We use the collected information for the following purposes:</p>
                    <ul className="list-disc list-inside ml-4 space-y-2">
                      <li>Providing and maintaining our avatar creation Service</li>
                      <li>Processing your requests and transactions</li>
                      <li>Monitoring usage and improving performance</li>
                      <li>Detecting and preventing abuse or fraud</li>
                      <li>Communicating with you about your account and updates</li>
                      <li>Complying with legal obligations</li>
                      <li>Research and development to improve our services</li>
                    </ul>
                  </div>
                </section>

                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Data Sharing and Disclosure</h2>
                  <div className="text-gray-700 space-y-6">
                    
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Third-Party Service Providers</h3>
                      <p>
                        We may share your information with third-party providers who assist us in operating our Service, including:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                        <li>AI model providers for avatar generation</li>
                        <li>Cloud infrastructure providers</li>
                        <li>Payment processors</li>
                        <li>Analytics and monitoring services</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Legal Requirements</h3>
                      <p>
                        We may disclose your information if required by law or in good faith belief that such action is necessary to:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                        <li>Comply with legal obligations</li>
                        <li>Protect and defend our rights or property</li>
                        <li>Prevent wrongdoing or protect safety</li>
                        <li>Protect against legal liability</li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800">
                        <strong>Important:</strong> We do not sell, rent, or trade your personal information to third parties for marketing purposes.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Data Security and Retention</h2>
                  <div className="text-gray-700 space-y-6">
                    
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Security Measures</h3>
                      <p>We implement industry-standard security measures to protect your information:</p>
                      <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                        <li>Encryption in transit and at rest</li>
                        <li>Access controls and authentication</li>
                        <li>Regular security audits and monitoring</li>
                        <li>Employee training on data protection</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Data Retention</h3>
                      <p>We retain your information for the following periods:</p>
                      <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                        <li>Account information: Until account deletion or as required by law</li>
                        <li>Usage logs: Up to 12 months for operational purposes</li>
                        <li>Content data: Processed temporarily and not permanently stored unless required</li>
                        <li>Billing records: As required by tax and accounting regulations</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Your Rights and Choices</h2>
                  <div className="text-gray-700 space-y-4">
                    <p>Depending on your location, you may have the following rights:</p>
                    
                    <div className="grid md:grid-cols-2 gap-6 mt-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-gray-900 font-semibold mb-2">Access & Portability</h4>
                        <p className="text-sm">Request a copy of your personal information and data portability.</p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-gray-900 font-semibold mb-2">Correction</h4>
                        <p className="text-sm">Update or correct inaccurate personal information.</p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-gray-900 font-semibold mb-2">Deletion</h4>
                        <p className="text-sm">Request deletion of your personal information (right to be forgotten).</p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-gray-900 font-semibold mb-2">Restriction</h4>
                        <p className="text-sm">Limit how we process your personal information.</p>
                      </div>
                    </div>

                    <p className="mt-6">
                      To exercise these rights, please contact us at <a href="mailto:privacy@pngtubermaker.com" className="text-[#06b6d4] hover:underline">privacy@pngtubermaker.com</a>.
                    </p>
                  </div>
                </section>

                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Cookies and Tracking</h2>
                  <div className="text-gray-700 space-y-4">
                    <p>
                      We use cookies and similar tracking technologies to enhance your experience and collect usage information. Types of cookies we use:
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-2">
                      <li><strong>Essential cookies:</strong> Required for the Service to function properly</li>
                      <li><strong>Analytics cookies:</strong> Help us understand how you use our Service</li>
                      <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
                    </ul>
                    <p>
                      You can control cookies through your browser settings, but disabling certain cookies may affect Service functionality.
                    </p>
                  </div>
                </section>

                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">8. International Data Transfers</h2>
                  <div className="text-gray-700 space-y-4">
                    <p>
                      Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place, including:
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-2">
                      <li>Standard contractual clauses</li>
                      <li>Adequacy decisions by relevant authorities</li>
                      <li>Certification schemes and codes of conduct</li>
                    </ul>
                  </div>
                </section>

                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">9. Children&apos;s Privacy</h2>
                  <div className="text-gray-700 space-y-4">
                    <p>
                      Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us immediately.
                    </p>
                  </div>
                </section>

                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">10. Changes to This Privacy Policy</h2>
                  <div className="text-gray-700 space-y-4">
                    <p>
                      We may update this Privacy Policy from time to time. We will notify you of significant changes by:
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-2">
                      <li>Posting the updated policy on our website</li>
                      <li>Sending you an email notification</li>
                      <li>Providing notice through our Service</li>
                    </ul>
                    <p>
                      Your continued use of the Service after changes take effect constitutes acceptance of the updated Privacy Policy.
                    </p>
                  </div>
                </section>

                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">11. Contact Us</h2>
                  <div className="text-gray-700 space-y-4">
                    <p>
                      If you have any questions about this Privacy Policy or our privacy practices, please contact us:
                    </p>
                    <div className="bg-gray-50 rounded-lg p-6 mt-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p><strong>Privacy Officer</strong></p>
                          <p>Email: privacy@pngtubermaker.com</p>
                          <p>Response time: Within 30 days</p>
                        </div>
                        <div>
                          <p><strong>General Contact</strong></p>
                          <p>Email: support@pngtubermaker.com</p>
                          <p><strong>Company:</strong> Dark Enlightenment Limited</p>
                          <p><strong>Address:</strong> 1111B S Governors Ave STE 26728<br />Dover, DE 19904 US</p>
                        </div>
                      </div>
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

export default Privacy;
