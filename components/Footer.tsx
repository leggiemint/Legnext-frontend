import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-transparent via-gray-100/50 to-transparent">
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 xl:px-20">
        <div className="py-16">
          {/* Main Footer Content */}
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8">
            
            {/* Brand Section */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start mb-4">
                <Image 
                  src="/images/logo.svg" 
                  alt="Legnext Logo" 
                  width={208}
                  height={52}
                  className="w-52 h-auto" 
                />
              </div>
              <p className="text-gray-600 text-sm max-w-md mx-auto lg:mx-0">
                The #1 way to access Midjourney via API. Integrate Midjourney-powered image generation into your applications without complexity.
              </p>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <a href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
                Contact
              </a>
              <a href="/terms" className="text-gray-600 hover:text-gray-900 transition-colors">
                Terms
              </a>
              <a href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">
                Privacy
              </a>
              <a href="/refund-policy" className="text-gray-600 hover:text-gray-900 transition-colors">
                Refunds
              </a>
            </div>

          </div>

          {/* Copyright Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-gray-500 text-sm text-center">
              © 2025 Dark Enlightenment Limited. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
