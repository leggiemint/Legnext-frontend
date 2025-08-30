import MainLayout from "@/components/MainLayout";
import { getSEOTags } from "@/libs/seo";
import Link from "next/link";

export const metadata = getSEOTags({
  title: "Contact PNGTuberMaker | Get Support for Avatar Creation",
  description: "Get in touch with PNGTuberMaker team for support with PNGTuber avatar creation. Email, Discord, and documentation available. We're here to help with your streaming avatar needs.",
  keywords: "contact pngtubermaker, pngtuber support, avatar creation help, streaming avatar support, pngtuber customer service, vtuber maker contact",
  canonicalUrlRelative: "/contact",
});

const Contact = () => {
  return (
    <MainLayout>
      <main className="min-h-screen pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Contact <span className="bg-gradient-to-r from-[#06b6d4] to-[#0891b2] bg-clip-text text-transparent">Us</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Have questions about PNGTuberMaker? We&apos;re here to help. Reach out to our team and we&apos;ll get back to you as soon as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Contact Form */}
            <div className="bg-white backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent transition-colors"
                      placeholder="Your first name"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent transition-colors"
                      placeholder="Your last name"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent transition-colors"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent transition-colors"
                    required
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="feature">Feature Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent transition-colors resize-none"
                    placeholder="Tell us how we can help you..."
                    required
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              
              {/* Contact Methods */}
              <div className="bg-white backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in touch</h2>
                
                <div className="space-y-6">
                  {/* Email */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-[#06b6d4]/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#06b6d4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Email</h3>
                      <p className="text-gray-700">support@pngtubermaker.com</p>
                      <p className="text-sm text-gray-500 mt-1">We typically respond within 24 hours</p>
                    </div>
                  </div>

                  {/* Documentation */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-[#06b6d4]/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#06b6d4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Documentation</h3>
                      <p className="text-gray-700">Check our comprehensive guides</p>
                      <Link href="/docs" className="text-[#06b6d4] hover:underline text-sm">Visit Documentation →</Link>
                    </div>
                  </div>

                  {/* Community */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-[#06b6d4]/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#06b6d4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Community</h3>
                      <p className="text-gray-700">Join our creator community</p>
                      <a href="https://discord.gg/zysPAnvP8f" target="_blank" rel="noopener noreferrer" className="text-[#06b6d4] hover:underline text-sm">Join Discord →</a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="bg-white backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-900 font-medium">Company:</span>
                    <span className="text-gray-700 ml-2">Dark Enlightenment Limited</span>
                  </div>
                  <div>
                    <span className="text-gray-900 font-medium">Address:</span>
                    <div className="text-gray-700 mt-1">
                      1111B S Governors Ave STE 26728<br />
                      Dover, DE 19904<br />
                      United States
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-900 font-medium">Website:</span>
                    <span className="text-gray-700 ml-2">pngtubermaker.com</span>
                  </div>
                </div>
              </div>

              {/* Response Time */}
              <div className="bg-white backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Response Times</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">General Inquiries</span>
                    <span className="text-gray-500">24-48 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Technical Support</span>
                    <span className="text-gray-500">12-24 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Billing Issues</span>
                    <span className="text-gray-500">2-6 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Enterprise</span>
                    <span className="text-[#06b6d4] font-medium">Priority Support</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </MainLayout>
  );
};

export default Contact;
