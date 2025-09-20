"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import config from "@/config";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import logo from "@/public/images/logo.svg";
import UserAvatar from "@/components/user/UserAvatar";
import { isReferralWidgetLoaded, showReferralWidget, waitForGetReditus } from "@/libs/getreditus";
import { useUser } from "@/contexts/UserContext";

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
  {
    href: "#affiliate",
    label: "Affiliate",
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
  const [isClient, setIsClient] = useState(false);
  const { user, isLoading } = useUser();
  
  // 确保客户端渲染
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 只有在客户端渲染完成且用户数据加载完成后才判断认证状态
  const isAuthenticated = isClient && !isLoading && !!user;

  // 主动加载推荐小部件的函数
  const loadReferralWidget = async () => {
    if (!isClient) return false;
    
    try {
      // 等待 GetReditus 脚本加载完成
      const isGetReditusLoaded = await waitForGetReditus(10000);
      if (!isGetReditusLoaded) {
        throw new Error('GetReditus script not loaded within timeout');
      }

      // 获取认证令牌
      const authResponse = await fetch('/api/getreditus/auth-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        throw new Error(errorData.error || 'Failed to get auth token');
      }

      const { auth_token, product_id } = await authResponse.json();

      // 准备用户详细信息
      const userDetails = {
        email: user?.email || '',
        first_name: user?.name?.split(' ')[0] || '',
        last_name: user?.name?.split(' ').slice(1).join(' ') || '',
        company_id: user?.id || '',
        company_name: 'Legnext User',
      };

      // 调用 GetReditus 加载推荐小部件
      if (typeof window !== 'undefined' && window.gr) {
        window.gr('loadReferralWidget', {
          product_id,
          auth_token,
          user_details: userDetails,
        });

        // 等待推荐小部件初始化
        let attempts = 0;
        const maxAttempts = 10;
        const checkInterval = 500;

        const checkWidget = () => {
          attempts++;
          
          if (window.referralWidget && typeof window.referralWidget.show === 'function') {
            return true;
          }
          
          if (attempts < maxAttempts) {
            setTimeout(checkWidget, checkInterval);
            return false;
          }
          return false;
        };

        // 开始检查
        setTimeout(checkWidget, 100);
        return true;
      } else {
        throw new Error('GetReditus gr function not available');
      }
    } catch (error) {
      console.error('Error loading referral widget:', error);
      return false;
    }
  };

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
  const UserAvatarSection = () => (
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
          className="flex relative justify-center items-center box-border overflow-hidden align-middle outline-none w-8 h-8 text-tiny bg-cyan-500 text-white rounded-full z-10 transition-transform hover:scale-105 p-0"
          aria-label="User menu"
        >
          <UserAvatar
            src={user?.image}
            name={user?.name}
            email={user?.email}
            size="sm"
            className="border-0"
          />
        </button>
        
        {/* User Dropdown Menu */}
        {isUserDropdownOpen && (
          <div className="user-dropdown absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={user?.image}
                  name={user?.name}
                  email={user?.email}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
            {/* Menu Items */}
            <div className="py-2">
              <Link 
                href="/app" 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setIsUserDropdownOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                href="/app/api-keys" 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setIsUserDropdownOpen(false)}
              >
                API Keys
              </Link>
              <hr className="my-2 border-gray-200" />
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
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 flex w-full p-0 justify-center border-b border-gray-200/20 bg-transparent backdrop-blur-xl transition-all">
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
            const isAffiliate = link.href === '#affiliate';
            
            if (isAffiliate) {
              if (!config.getreditus?.enabled) {
                return null;
              }

              return isAuthenticated ? (
                <button
                  key={link.href}
                  onClick={async () => {
                    if (!isClient) return;
                    
                    try {
                      // 先检查是否已加载
                      if (isReferralWidgetLoaded()) {
                        showReferralWidget();
                        return;
                      }
                      
                      // 如果未加载，主动加载推荐小部件
                      console.log('Loading referral widget...');
                      const loaded = await loadReferralWidget();
                      
                      if (loaded) {
                        // 等待一下让推荐小部件完全初始化
                        setTimeout(() => {
                          if (isReferralWidgetLoaded()) {
                            showReferralWidget();
                          }
                        }, 1000);
                      } else {
                        console.warn('Failed to load referral widget');
                      }
                    } catch (error) {
                      console.error('Error loading referral widget:', error);
                    }
                  }}
                  className="flex items-center text-sm lg:text-[1rem] font-medium transition-colors text-gray-600 hover:text-gray-900 whitespace-nowrap flex-shrink-0"
                  title={link.label}
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  href="/api/auth/signin"
                  key={link.href}
                  className="flex items-center text-sm lg:text-[1rem] font-medium transition-colors text-gray-600 hover:text-gray-900 whitespace-nowrap flex-shrink-0"
                  title={`${link.label} (Login required)`}
                >
                  {link.label}
                </Link>
              );
            }
            
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
          {isAuthenticated ? (
            <UserAvatarSection />
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
              const isAffiliate = link.href === '#affiliate';
              
              if (isAffiliate) {
                if (!config.getreditus?.enabled) {
                  return null;
                }

                return isAuthenticated ? (
                  <button
                    key={link.href}
                    onClick={async () => {
                      if (!isClient) return;
                      
                      try {
                        // 先检查是否已加载
                        if (isReferralWidgetLoaded()) {
                          showReferralWidget();
                          setIsMobileMenuOpen(false);
                          return;
                        }
                        
                        // 如果未加载，主动加载推荐小部件
                        console.log('Loading referral widget...');
                        const loaded = await loadReferralWidget();
                        
                        if (loaded) {
                          // 等待一下让推荐小部件完全初始化
                          setTimeout(() => {
                            if (isReferralWidgetLoaded()) {
                              showReferralWidget();
                            }
                          }, 1000);
                        } else {
                          console.warn('Failed to load referral widget');
                        }
                        setIsMobileMenuOpen(false);
                      } catch (error) {
                        console.error('Error loading referral widget:', error);
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    className="flex items-center p-2 w-full text-sm font-medium rounded-md hover:bg-gray-100 transition-colors mobile-menu-link"
                    title={link.label}
                  >
                    {link.label}
                  </button>
                ) : (
                  <Link
                    href="/api/auth/signin"
                    key={link.href}
                    className="flex items-center p-2 w-full text-sm font-medium rounded-md hover:bg-gray-100 transition-colors mobile-menu-link"
                    title={`${link.label} (Login required)`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              }
              
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
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="px-2 py-1 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        src={user?.image}
                        name={user?.name}
                        email={user?.email}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.name || "User"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Link 
                    href="/app" 
                    className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/app/api-keys" 
                    className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    API Keys
                  </Link>
                  <hr className="my-2 border-gray-200" />
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
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors rounded-md"
                  >
                    Sign Out
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
