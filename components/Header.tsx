"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import config from "@/config";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import logo from "@/app/logo.svg";

const links: {
  href: string;
  label: string;
}[] = [
  {
    href: "/app/midjourney",
    label: "Midjourney API",
  },
  {
    href: "https://docs.legnext.ai/",
    label: "Docs",
  },
  {
    href: "/pricing",
    label: "Pricing",
  },
];

const cta = (
  <Link href="/app/midjourney">
    <button className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-600/90 transition-colors duration-200 shadow-sm">
      Create Now
    </button>
  </Link>
);

const Header = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeaderContent />
    </Suspense>
  );
};

const HeaderContent = () => {
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState<boolean>(false);
  const { data: session } = useSession();

  // Close menus when the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
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
        if (isUserDropdownOpen) setIsUserDropdownOpen(false);
      }
    };

    if (isMobileMenuOpen || isUserDropdownOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen, isUserDropdownOpen]);

  // Handle click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      
      // Close mobile menu if clicking outside
      if (isMobileMenuOpen && !target.closest('.mobile-menu-overlay') && !target.closest('.mobile-menu-btn')) {
        setIsMobileMenuOpen(false);
      }
      
      // Close user dropdown if clicking outside
      if (isUserDropdownOpen && !target.closest('.user-dropdown') && !target.closest('.user-avatar-btn')) {
        setIsUserDropdownOpen(false);
      }
    };

    if (isMobileMenuOpen || isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen, isUserDropdownOpen]);

  // User avatar component
  const UserAvatar = () => (
    <div className="flex items-center space-x-3">
      {/* Dashboard Button - Hidden on mobile */}
      <div className="hidden md:block">
        <Link href="/app/midjourney">
          <button className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-600/90 transition-colors duration-200 shadow-sm">
            Dashboard
          </button>
        </Link>
      </div>
      
      {/* User Avatar - Hidden on mobile */}
      <div className="hidden md:block relative">
        <button
          onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
          className="user-avatar-btn flex items-center justify-center w-10 h-10 rounded-full border-2 border-purple-600 bg-white hover:bg-gray-50 transition-colors duration-200"
          aria-label="User menu"
        >
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "User avatar"}
              width={36}
              height={36}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {session?.user?.name?.charAt(0).toUpperCase() || session?.user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </button>
        
        {/* User Dropdown Menu */}
        {isUserDropdownOpen && (
          <div className="user-dropdown absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">
                {session?.user?.name || "User"}
              </p>
              <p className="text-sm text-gray-500">
                {session?.user?.email}
              </p>
            </div>
            <button
              onClick={async () => {
                try {
                  await signOut({ callbackUrl: "/" });
                  setIsUserDropdownOpen(false);
                } catch (error) {
                  console.error("Sign out error:", error);
                  window.location.href = "/";
                }
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 flex w-full p-0 justify-center border-b border-gray-200/20 bg-white/60 backdrop-blur-xl transition-all">
      <div className="container flex justify-between items-center py-3 h-12 md:py-4 md:h-16 min-w-0">
        {/* Left Side: Logo */}
        <div className="flex items-center">
          <Link
            href="/"
            aria-label={config.appName}
            className="flex items-center space-x-2 basis-[100px] sm:basis-[130px] md:basis-[160px] flex-shrink-0 flex-grow-0"
            title={`${config.appName} homepage`}
          >
            <div>
              <Image
                src={logo}
                alt={`${config.appName} Logo`}
                className="w-[100px] sm:w-[130px] md:w-[160px] h-auto"
                priority={true}
                width={200}
                height={50}
              />
            </div>
          </Link>
        </div>
        
        {/* Center: Navigation Links (Hidden on mobile) */}
        <div className="hidden md:flex items-center gap-4 overflow-x-auto absolute left-1/2 transform -translate-x-1/2">
          {links.map((link) => {
            const isExternal = link.href.startsWith('http');
            return isExternal ? (
              <a
                href={link.href}
                key={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm lg:text-[1rem] font-medium transition-colors text-gray-600 hover:text-gray-900 whitespace-nowrap flex-shrink-0"
                title={`${link.label} (opens in new tab)`}
              >
                {link.label}
                <svg className="w-3 h-3 ml-1 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ) : (
              <Link
                href={link.href}
                key={link.href}
                className="flex items-center text-sm lg:text-[1rem] font-medium transition-colors text-gray-600 hover:text-gray-900 whitespace-nowrap flex-shrink-0"
                title={link.label}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          {/* Show user avatar and dashboard when logged in, otherwise show CTA */}
          {session ? (
            <UserAvatar />
          ) : (
            <>
              {/* CTA Button (Hidden on small mobile) */}
              <div className="hidden sm:block auth-button-placeholder">
                {cta}
              </div>
              
              {/* Mobile CTA Display (Visible only on small screens) */}
              <div className="block sm:hidden">
                <Link href="/app/midjourney">
                  <button className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-600/90 transition-colors duration-200 shadow-sm">
                    Create Now
                  </button>
                </Link>
              </div>
            </>
          )}
          
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
            {links.map((link) => {
              const isExternal = link.href.startsWith('http');
              return isExternal ? (
                <a
                  href={link.href}
                  key={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-2 w-full text-sm font-medium rounded-md hover:bg-gray-100 transition-colors mobile-menu-link"
                  title={`${link.label} (opens in new tab)`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                  <svg className="w-3 h-3 ml-1 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <Link
                  href={link.href}
                  key={link.href}
                  className="flex items-center p-2 w-full text-sm font-medium rounded-md hover:bg-gray-100 transition-colors mobile-menu-link"
                  title={link.label}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            
            {/* Telegram Link in Mobile Menu */}
            <Link
              href="https://t.me/+PsZ-Qun0hKViNjZl"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-2 w-full text-sm font-medium rounded-md hover:bg-gray-100 transition-colors mobile-menu-link"
              title="Join Telegram"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <svg className="w-4 h-4 mr-2" fill="#0088cc" viewBox="0 0 24 24">
                <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.787L21.815 4.922c.314-1.272-.472-1.849-1.15-1.205z"/>
              </svg>
              Join Telegram
            </Link>
            
            {/* Mobile CTA/Auth Section */}
            <div className="mt-4 p-2">
              {session ? (
                <div className="space-y-2">
                  <div className="px-2 py-1 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {session.user?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {session.user?.email}
                    </p>
                  </div>
                  <Link href="/app/midjourney" className="w-full">
                    <button className="w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-600/90 transition-colors duration-200 shadow-sm">
                      Dashboard
                    </button>
                  </Link>
                  <button
                    onClick={async () => {
                      try {
                        await signOut({ callbackUrl: "/" });
                        setIsMobileMenuOpen(false);
                      } catch (error) {
                        console.error("Sign out error:", error);
                        window.location.href = "/";
                      }
                    }}
                    className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-gray-100 text-gray-700 hover:bg-gray-200 h-9 px-3 rounded-md text-sm"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <Link href="/app/midjourney" className="w-full">
                  <button className="w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-600/90 transition-colors duration-200 shadow-sm">
                    Create Now
                  </button>
                </Link>
              )}
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