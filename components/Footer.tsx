import Image from "next/image";
import logo from "@/app/logo.svg";

const footerLinks = {
  functions: {
    title: "Functions",
    links: [
      { label: "Imagine", href: "/functions/imagine" },
      { label: "Upscale", href: "/functions/upscale" },
      { label: "Variation", href: "/functions/variation" },
      { label: "Describe", href: "/functions/describe" },
      { label: "Blend", href: "/functions/blend" },
      { label: "Inpaint", href: "/functions/inpaint" },
      { label: "Zoom", href: "/functions/zoom" },
      { label: "Pan", href: "/functions/pan" },
    ]
  },
  supported_modes: {
    title: "Modes",
    links: [
      { label: "Fast Mode", href: "/modes/fast" },
      { label: "Turbo Mode", href: "/modes/turbo" },
    ]
  },
  resources: {
    title: "Resources",
    links: [
      { label: "Documentation", href: "https://docs.legnext.ai/", target: "_blank", rel: "noopener noreferrer" },
      { label: "Pricing", href: "/pricing" },
      { label: "API Examples", href: "/examples" },
    ]
  },
  about: {
    title: "About",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "Terms of Service", href: "/terms-of-service" },
      { label: "Privacy Policy", href: "/privacy-policy" },
    ]
  },
};

const Footer = () => {
  return (
    <footer className="bg-white">
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 xl:px-20">
        <div className="py-16">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-6">
                <Image
                  src={logo}
                  alt="Legnext Logo"
                  className="w-[120px] sm:w-[140px] md:w-[160px] h-auto"
                  priority={true}
                  width={160}
                  height={40}
                />
              </div>
              <p className="text-gray-600 text-base leading-relaxed">
                Integrate the Midjourney API into your apps and workflows without complexity.
              </p>
            </div>

            {/* Navigation Columns */}
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
              {/* Functions Column */}
              <div>
                <h3 className="text-gray-900 font-bold text-lg mb-5">{footerLinks.functions.title}</h3>
                <ul className="space-y-3">
                  {footerLinks.functions.links.map((link, index) => (
                    <li key={index}>
                      <a href={link.href} className="text-gray-600 hover:text-[#4f46e5] text-base transition-colors duration-200 font-medium">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Supported Modes Column */}
              <div>
                <h3 className="text-gray-900 font-bold text-lg mb-5">{footerLinks.supported_modes.title}</h3>
                <ul className="space-y-3">
                  {footerLinks.supported_modes.links.map((link, index) => (
                    <li key={index}>
                      <a href={link.href} className="text-gray-600 hover:text-[#4f46e5] text-base transition-colors duration-200 font-medium">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resources Column */}
              <div>
                <h3 className="text-gray-900 font-bold text-lg mb-5">{footerLinks.resources.title}</h3>
                <ul className="space-y-3">
                  {footerLinks.resources.links.map((link, index) => (
                    <li key={index}>
                      <a 
                        href={link.href} 
                        className="text-gray-600 hover:text-[#4f46e5] text-base transition-colors duration-200 font-medium"
                        target={link.target}
                        rel={link.rel}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* About Column */}
              <div>
                <h3 className="text-gray-900 font-bold text-lg mb-5">{footerLinks.about.title}</h3>
                <ul className="space-y-3">
                  {footerLinks.about.links.map((link, index) => (
                    <li key={index}>
                      <a href={link.href} className="text-gray-600 hover:text-[#4f46e5] text-base transition-colors duration-200 font-medium">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Copyright Section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-500 text-base font-medium">
                © 2025 Legnext - All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
