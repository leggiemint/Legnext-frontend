"use client";

import Image from "next/image";

const MidjourneySection = () => {
  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            <span className="block mb-2">Generate high-quality images with</span>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mt-4">
              <div className="bg-white border border-gray-200 rounded-full px-3 sm:px-4 py-2 flex items-center gap-2 shadow-lg">
                <svg 
                  className="w-5 sm:w-6 h-5 sm:h-6 text-purple-600" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M3 18h18v2H3v-2zm16-4H5l-2-8h18l-2 8zM7 8l1.5-6h7L17 8H7z"/>
                  <path d="M12 4l-1 4h2l-1-4z" fill="currentColor"/>
                </svg>
                <span className="text-gray-900 font-bold text-xl sm:text-2xl md:text-3xl">Midjourney</span>
              </div>
              <span className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">, the best Model for AI Images.</span>
            </div>
          </h2>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          
          {/* Left Side: Text Card + Buttons */}
          <div className="flex flex-col h-full order-2 lg:order-1">
            
            {/* Text Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8 flex-1">
     
              {/* Step Content */}
              <div className="mb-6 md:mb-8">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">Bring Midjourney to Your Apps</h3>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  The most advanced AI image model, now accessible through the Legnext API. Full Midjourney features, latest models, and enterprise-grade stability — all in one integration.
                </p>
              </div>

              {/* Testimonial */}
              <div className="border-t border-gray-200 pt-4 md:pt-6">
                <div className="mb-3 md:mb-4">
                  <h4 className="text-gray-900 font-semibold text-sm md:text-base">Ondrej B.</h4>
                  <p className="text-gray-500 text-xs md:text-sm">CEO & Founder - Small Business</p>
                </div>
                <p className="text-gray-600 italic text-sm md:text-base">
                  &ldquo;Legnext&apos;s Midjourney API works flawlessly at scale. I&apos;ve tested many providers, but this is by far the most reliable and stable solution.&rdquo;
                </p>
              </div>
            </div>

            {/* Action Buttons - Outside the card */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-4 md:mt-6">
              <button
                onClick={() => window.location.href = '/app'}
                className="relative flex h-11 w-full items-center justify-center px-6 before:absolute before:inset-0 before:rounded-full before:bg-gray-200 before:transition before:duration-300 hover:before:scale-105 active:duration-75 active:before:scale-95 cursor-pointer"
              >
                <svg 
                  className="relative w-4 md:w-5 h-4 md:h-5 mr-2 text-purple-600" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M3 18h18v2H3v-2zm16-4H5l-2-8h18l-2 8zM7 8l1.5-6h7L17 8H7z"/>
                  <path d="M12 4l-1 4h2l-1-4z" fill="currentColor"/>
                </svg>
                <span className="relative text-sm md:text-base font-semibold text-black">Try Image API</span>
              </button>
              
              <a
                href="https://docs.legnext.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex h-11 w-full items-center justify-center px-6 before:absolute before:inset-0 before:rounded-full before:border before:border-gray-600 before:bg-transparent before:transition before:duration-300 hover:before:scale-105 active:duration-75 active:before:scale-95"
              >
                <span className="relative text-sm md:text-base font-semibold text-gray-900">View docs</span>
              </a>
            </div>
          </div>

          {/* Right Side: Image */}
          <div className="relative order-1 lg:order-2">
            <div className="aspect-[16/10] md:aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden border border-gray-200 shadow-2xl">
              <Image 
                src="/images/showcase00.webp" 
                alt="High-quality AI generated portrait created with Midjourney" 
                width={600}
                height={400}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default MidjourneySection;
