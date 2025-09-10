"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import logo from "@/app/logo.svg";
import ButtonSignin from "./ButtonSignin";
import UserAvatar from "./UserAvatar";
import { useUserProfile } from "@/hooks/useUserProfile";

const AppHeader = () => {
  const { userProfile, isAuthenticated } = useUserProfile();
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
                className="w-[100px] sm:w-[130px] md:w-[160px] h-auto"
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
        {!isAuthenticated && (
          <li className="text-medium whitespace-nowrap box-border list-none flex items-center gap-1 sm:gap-2 mx-0 px-0">
            <ButtonSignin text="Sign In" />
          </li>
        )}

        {/* Telegram Link */}
        <li className="text-medium whitespace-nowrap box-border list-none flex items-center gap-1 sm:gap-2 mx-0 px-0">
          <Link 
            href="https://t.me/+PsZ-Qun0hKViNjZl"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 bg-[#0088cc] text-white font-medium rounded-lg hover:bg-[#0088cc]/90 transition-colors duration-200 shadow-sm gap-2"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.787L21.815 4.922c.314-1.272-.472-1.849-1.15-1.205z"/>
            </svg>
            <span className="hidden sm:inline">Join Telegram</span>
            <span className="sm:hidden">Telegram</span>
          </Link>
        </li>

        {/* User Menu for authenticated users */}
        {isAuthenticated && (
          <li className="text-medium whitespace-nowrap box-border list-none flex items-center gap-1 sm:gap-2 mx-0 px-0">
            {/* User Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex relative justify-center items-center box-border overflow-hidden align-middle outline-none w-8 h-8 text-tiny bg-cyan-500 text-white rounded-full z-10 transition-transform hover:scale-105 p-0"
              >
                <UserAvatar
                  src={userProfile?.image}
                  name={userProfile?.name}
                  email={userProfile?.email}
                  size="sm"
                  className="border-0"
                />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-base-100 rounded-lg shadow-lg border border-base-300 py-2 z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-base-200">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        src={userProfile?.image}
                        name={userProfile?.name}
                        email={userProfile?.email}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-base-content truncate">
                          {userProfile?.name || "User"}
                        </p>
                        <p className="text-xs text-base-content/60 truncate">
                          {userProfile?.email}
                        </p>
                        {userProfile?.profile && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-purple-600 font-medium">
                              {userProfile.profile.apiCalls || userProfile.profile.credits} credits
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-600 capitalize">
                              {userProfile.profile.plan} plan
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <Link 
                      href="/app" 
                      className="block px-4 py-2 text-sm text-base-content hover:bg-base-200 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href="/app/api-keys" 
                      className="block px-4 py-2 text-sm text-base-content hover:bg-base-200 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      API Keys
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