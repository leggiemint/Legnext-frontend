"use client";

import { useState, useEffect } from "react";
import type { JSX } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/app/logo.svg";
import config from "@/config";

const links: {
  href: string;
  label: string;
}[] = [
  {
    href: "/pricing",
    label: "Pricing",
  },
  {
    href: "/blog",
    label: "Blog",
  },
  {
    href: "/contact",
    label: "Contact",
  },
];

const cta: JSX.Element = (
  <Link href="/app">
    <button className="inline-flex items-center justify-center px-4 py-2 bg-[#06b6d4] text-white font-medium rounded-lg hover:bg-[#06b6d4]/90 transition-colors duration-200 shadow-sm">
      Create Now
    </button>
  </Link>
);

// A header with a logo on the left, links in the center (like Pricing, etc...), and a CTA (like Create Now) on the right.
// The header is responsive, and on mobile, the links are hidden behind a burger button.
const Header = () => {
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Close menus when the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [searchParams]);

  // Handle body class for mobile menu
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isMobileMenuOpen]);

  // Handle escape key for closing menus
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMobileMenuOpen) setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen]);

  // Handle click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      
      // Close mobile menu if clicking outside
      if (isMobileMenuOpen && !target.closest('.mobile-menu-overlay') && !target.closest('.mobile-menu-btn')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-40 flex w-full p-0 justify-center border-b border-gray-200/20 bg-white/60 backdrop-blur-xl transition-all">
      <div className="container flex justify-between items-center py-3 h-12 md:py-4 md:h-16 min-w-0">
        {/* Left Side: Logo */}
        <div className="flex items-center">
          <Link
            href="/"
            aria-label={config.appName}
            className="flex items-center space-x-2 basis-[120px] sm:basis-[160px] md:basis-[200px] flex-shrink-0 flex-grow-0"
            title={`${config.appName} homepage`}
          >
            <div>
              <Image
                src={logo}
                alt={`${config.appName} Logo`}
                className="w-[120px] sm:w-[160px] md:w-[200px] h-auto"
                priority={true}
                width={200}
                height={50}
              />
            </div>
          </Link>
        </div>
        
        {/* Center: Navigation Links (Hidden on mobile) */}
        <div className="hidden md:flex items-center gap-4 overflow-x-auto absolute left-1/2 transform -translate-x-1/2">
          {links.map((link) => (
            <Link
              href={link.href}
              key={link.href}
              className="flex items-center text-sm lg:text-[1rem] font-medium transition-colors text-gray-600 hover:text-gray-900 whitespace-nowrap flex-shrink-0"
              title={link.label}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          {/* CTA Button (Hidden on small mobile) */}
          <div className="hidden sm:block auth-button-placeholder">
            {cta}
          </div>
          
          {/* Mobile CTA Display (Visible only on small screens) */}
          <div className="block sm:hidden">
            <Link href="/app">
              <button className="inline-flex items-center justify-center px-4 py-2 bg-[#06b6d4] text-white font-medium rounded-lg hover:bg-[#06b6d4]/90 transition-colors duration-200 shadow-sm">
                Create Now
              </button>
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <button
            type="button"
            className="mobile-menu-btn flex items-center md:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open mobile menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu">
              <line x1="4" x2="20" y1="12" y2="12"></line>
              <line x1="4" x2="20" y1="6" y2="6"></line>
              <line x1="4" x2="20" y1="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={`mobile-menu-overlay fixed inset-0 top-16 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 bg-transparent backdrop-blur-sm md:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? "" : "hidden"}`}
      >
        <div className="grid relative z-20 p-4 rounded-md border shadow-md bg-white border-gray-200">
          <div className="flex justify-end items-center">
            <button 
              className="rounded-sm opacity-70 transition-opacity ring-offset-background hover:opacity-100 p-2"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close mobile menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
              <span className="sr-only">Close</span>
            </button>
          </div>
          
          <nav className="grid grid-flow-row auto-rows-max text-sm">
            {links.map((link) => (
              <Link
                href={link.href}
                key={link.href}
                className="flex items-center p-2 w-full text-sm font-medium rounded-md hover:bg-gray-100 transition-colors mobile-menu-link"
                title={link.label}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Discord Link in Mobile Menu */}
            <Link
              href="https://discord.gg/zysPAnvP8f"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-2 w-full text-sm font-medium rounded-md hover:bg-gray-100 transition-colors mobile-menu-link"
              title="Join Discord"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <svg className="w-4 h-4 mr-2" fill="#5865F2" viewBox="0 0 24 24">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
              </svg>
              Join Discord
            </Link>
            
            {/* Mobile CTA Section */}
            <div className="mt-4 p-2">
              <Link href="/app" className="w-full">
                <button className="w-full inline-flex items-center justify-center px-4 py-2 bg-[#06b6d4] text-white font-medium rounded-lg hover:bg-[#06b6d4]/90 transition-colors duration-200 shadow-sm">
                  Create Now
                </button>
              </Link>
            </div>
          </nav>
        </div>
      </div>
      
      <style jsx>{`
        /* Header styling */
        header {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        
        /* Container responsive padding like the reference */
        .container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding-left: 1rem;
          padding-right: 1rem;
        }
        
        @media (min-width: 640px) {
          .container {
            padding-left: 1.5rem;
            padding-right: 1.5rem;
          }
        }
        
        @media (min-width: 1024px) {
          .container {
            padding-left: 2rem;
            padding-right: 2rem;
          }
        }
        
        /* Prevent layout shift during auth button loading */
        .auth-button-placeholder {
          transition: opacity 0.2s ease-in-out;
          min-width: 80px;
        }
        
        /* Ensure smooth transitions for all button states */
        .auth-button-placeholder button,
        .auth-button-placeholder div {
          transition: all 0.2s ease-in-out;
        }
        
        /* Mobile menu button styling */
        .mobile-menu-btn {
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s ease-in-out;
          border: none;
          background: transparent;
          cursor: pointer;
        }
        
        .mobile-menu-btn:hover {
          background-color: rgba(0, 0, 0, 0.05);
          transform: scale(1.05);
        }
        
        /* Prevent scroll when menu is open */
        body.mobile-menu-open {
          overflow: hidden;
        }
      `}</style>
    </header>
  );
};

export default Header;