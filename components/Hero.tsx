"use client";

import Image from "next/image";
import config from "@/config";

const Hero = () => {
  return (
    <div className="relative pt-16 pb-24 bg-white">
      <div aria-hidden="true" className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20">
        <div className="blur-[106px] h-56 bg-gradient-to-br from-primary to-purple-400"></div>
        <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-8">
        <div className="relative pt-16 mx-auto text-center">
          <div className="w-full">
            <p className="text-gray-600 text-lg md:text-xl mb-4">
              Create Anime Avatars for Streaming
            </p>
            <h1 className="text-gray-900 font-bold text-6xl md:text-7xl xl:text-8xl">
              AI <span className="bg-gradient-to-r from-[#06b6d4] to-[#06b6d4] bg-clip-text text-transparent">PNGTuber</span> Maker
            </h1>
            <p className="mt-8 text-gray-600 text-lg md:text-xl">
              Transform your streaming presence with AI-powered PNGTuber avatars. Generate expressive characters in minutes, not days.
            </p>
            
            {/* Feature highlights */}
            <div className="mt-12 flex flex-wrap justify-center gap-6 md:gap-8">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span className="text-gray-700 font-medium">5+ Expressions auto-generated</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span className="text-gray-700 font-medium">Blinking & Talking Animations</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span className="text-gray-700 font-medium">Ready in &lt;2 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span className="text-gray-700 font-medium">90% cheaper than Live2D models</span>
              </div>
            </div>
            
            <div className="mt-16 flex justify-center">
              <button
                onClick={() => window.location.href = '/auth'}
                className="relative flex h-11 items-center justify-center px-6 before:absolute before:inset-0 before:rounded-full before:bg-[#06b6d4] before:transition before:duration-300 hover:before:scale-105 active:duration-75 active:before:scale-95 cursor-pointer"
              >
                <svg className="relative w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="white"/>
                </svg>
                <span className="relative text-base font-semibold text-white">
                  Try Free Demo
                </span>
              </button>
            </div>
            
            {/* Trust elements */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 mb-4">Trusted by creators worldwide</p>
              <div className="flex justify-center items-center gap-3">
                <div className="flex -space-x-2">
                  <Image 
                    src="/images/avatars/avatar-1.webp" 
                    alt="Creator avatar" 
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm" 
                  />
                  <Image 
                    src="/images/avatars/avatar-2.webp" 
                    alt="Creator avatar" 
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm" 
                  />
                  <Image 
                    src="/images/avatars/avatar-3.webp" 
                    alt="Creator avatar" 
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm" 
                  />
                  <Image 
                    src="/images/avatars/avatar-4.webp" 
                    alt="Creator avatar" 
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm" 
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>1000+ avatars created</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
