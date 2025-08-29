"use client";

import { useState, useEffect } from "react";
import type { JSX } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ButtonSignin from "./ButtonSignin";
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

const cta: JSX.Element = <ButtonSignin extraStyle="btn-primary" />;

// A header with a logo on the left, links in the center (like Pricing, etc...), and a CTA (like Get Started or Login) on the right.
// The header is responsive, and on mobile, the links are hidden behind a burger button.
const Header = () => {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // setIsOpen(false) when the route changes (i.e: when the user clicks on a link on mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [searchParams]);

  // Handle body class for mobile menu
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isOpen]);

  // Handle escape key for closing mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Handle click outside to close mobile menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (isOpen && !target.closest('.mobile-menu-overlay') && !target.closest('.mobile-menu-btn')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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
          {/* Auth Button (Hidden on small mobile) */}
          <div className="hidden sm:block auth-button-placeholder">
            {cta}
          </div>
          
          {/* Mobile Auth Display (Visible only on small screens) */}
          <div className="block sm:hidden">
            <Link href="/auth">
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-[#06b6d4] text-white hover:bg-[#06b6d4]/90 h-9 px-3 rounded-md px-2 text-sm whitespace-nowrap">
                Create Now
              </button>
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <button
            type="button"
            className="mobile-menu-btn flex items-center md:hidden"
            onClick={() => setIsOpen(true)}
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
        className={`mobile-menu-overlay fixed inset-0 top-16 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 bg-transparent backdrop-blur-sm md:hidden transition-all duration-300 ease-in-out ${isOpen ? "" : "hidden"}`}
      >
        <div className="grid relative z-20 p-4 rounded-md border shadow-md bg-white border-gray-200">
          <div className="flex justify-end items-center">
            <button 
              className="rounded-sm opacity-70 transition-opacity ring-offset-background hover:opacity-100 p-2"
              onClick={() => setIsOpen(false)}
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
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Mobile Auth Section */}
            <div className="mt-4 p-2">
              <Link href="/auth" className="w-full">
                <button className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-[#06b6d4] text-white hover:bg-[#06b6d4]/90 h-9 px-3 rounded-md text-sm">
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
        
        /* Mobile auth container optimization */
        .mobile-auth-container {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          align-items: stretch;
        }
        
        .mobile-auth-container .flex-row {
          flex-direction: column !important;
          gap: 0.75rem !important;
        }
        
        .mobile-auth-container button {
          width: 100% !important;
          justify-content: center !important;
          flex: none !important;
          min-width: auto !important;
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
