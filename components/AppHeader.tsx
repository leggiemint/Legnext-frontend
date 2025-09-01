"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import logo from "@/app/logo.svg";
import ButtonSignin from "./ButtonSignin";

const AppHeader = () => {
  const { data: session } = useSession();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="z-40 flex px-6 gap-4 w-full flex-row relative flex-nowrap items-center justify-between h-16 max-w-full bg-base-100 shadow-sm">
      {/* Left side - Logo */}
      <div className="flex basis-0 flex-row flex-grow flex-nowrap justify-start bg-transparent items-center no-underline text-medium whitespace-nowrap box-border">
        <Link href="/">
          <div className="relative shadow-black/5 shadow-none rounded-large" style={{ maxWidth: "fit-content" }}>
            <div className="flex items-center gap-3">
              {/* Logo from logo.svg */}
              <Image
                src={logo}
                alt="Legnext Logo"
                className="w-[120px] sm:w-[160px] md:w-[200px] h-auto"
                priority={true}
                width={200}
                height={50}
              />
            </div>
          </div>
        </Link>
      </div>

      {/* Right side - Navigation and User Menu */}
      <ul className="flex gap-4 h-full flex-row flex-nowrap items-center px-0 mx-0">
        {/* Login Button for unauthenticated users */}
        {!session && (
          <li className="text-medium whitespace-nowrap box-border list-none flex items-center gap-1 sm:gap-2 mx-0 px-0">
            <ButtonSignin text="Sign In" />
          </li>
        )}

        {/* Discord Link */}
        <li className="text-medium whitespace-nowrap box-border list-none flex items-center gap-1 sm:gap-2 mx-0 px-0">
          <Link 
            href="https://discord.gg/zysPAnvP8f"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 bg-[#5865F2] text-white font-medium rounded-lg hover:bg-[#5865F2]/90 transition-colors duration-200 shadow-sm gap-2"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
            </svg>
            <span className="hidden sm:inline">Join Discord</span>
            <span className="sm:hidden">Discord</span>
          </Link>
        </li>

        {/* User Menu for authenticated users */}
        {session && (
          <li className="text-medium whitespace-nowrap box-border list-none flex items-center gap-1 sm:gap-2 mx-0 px-0">
            {/* User Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex relative justify-center items-center box-border overflow-hidden align-middle outline-none w-8 h-8 text-tiny bg-cyan-500 text-white rounded-full z-10 transition-transform hover:scale-105"
              >
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt="User avatar"
                    width={32}
                    height={32}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {session?.user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-base-100 rounded-lg shadow-lg border border-base-300 py-2 z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-base-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
                        {session?.user?.image ? (
                          <Image
                            src={session.user.image}
                            alt="User avatar"
                            width={40}
                            height={40}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold">
                            {session?.user?.name?.[0]?.toUpperCase() || "U"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-base-content truncate">
                          {session?.user?.name || "User"}
                        </p>
                        <p className="text-xs text-base-content/60 truncate">
                          {session?.user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <Link 
                      href="/app/settings" 
                      className="block px-4 py-2 text-sm text-base-content hover:bg-base-200 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <Link 
                      href="/app" 
                      className="block px-4 py-2 text-sm text-base-content hover:bg-base-200 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <hr className="my-2 border-base-200" />
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        signOut({ callbackUrl: "/app" });
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-base-200 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </li>
        )}
      </ul>

      {/* Click outside to close dropdown */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default AppHeader;