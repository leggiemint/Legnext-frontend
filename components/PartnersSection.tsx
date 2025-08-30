"use client";

import Image from "next/image";

const PartnersSection = () => {
  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-8">
        <h2 className="text-center font-sans mb-4 text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">
          Powered by AI models like
        </h2>
        <p className="text-center text-sm md:text-base lg:text-lg text-gray-600 mb-4 md:mb-8">
          Powered by the world&apos;s most advanced AI models for PNGTuber creation
        </p>
        
        <div className="group flex overflow-hidden p-2 [gap:var(--gap)] flex-row py-2 [--duration:45s] [--gap:1rem]">
          {/* First set of partners */}
          <div className="flex shrink-0 justify-around [gap:var(--gap)] animate-marquee flex-row group-hover:[animation-play-state:paused]">
            {/* AI Model Partners */}
            <div className="flex-shrink-0 mx-2">
              <div className="flex items-center space-x-2 md:space-x-3 bg-white rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-sm hover:shadow-md transition-shadow">
                <Image 
                  src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openai.svg" 
                  alt="OpenAI GPT-4" 
                  width={24}
                  height={24}
                  className="w-5 h-5 md:w-6 md:h-6 object-contain"
                />
                <span className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">OpenAI GPT-4</span>
              </div>
            </div>
            
            <div className="flex-shrink-0 mx-2">
              <div className="flex items-center space-x-2 md:space-x-3 bg-white rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-sm hover:shadow-md transition-shadow">
                <Image 
                  src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/flux.svg" 
                  alt="Flux AI" 
                  width={24}
                  height={24}
                  className="w-5 h-5 md:w-6 md:h-6 object-contain"
                />
                <span className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">Flux AI</span>
              </div>
            </div>
            
            <div className="flex-shrink-0 mx-2">
              <div className="flex items-center space-x-2 md:space-x-3 bg-white rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-sm hover:shadow-md transition-shadow">
                <svg className="w-5 h-5 md:w-6 md:h-6 object-contain text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                <span className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">Stable Diffusion</span>
              </div>
            </div>
            
            <div className="flex-shrink-0 mx-2">
              <div className="flex items-center space-x-2 md:space-x-3 bg-white rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-sm hover:shadow-md transition-shadow">
                <svg className="w-5 h-5 md:w-6 md:h-6 object-contain text-purple-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">DALL-E 3</span>
              </div>
            </div>
            
            {/* Streaming Platforms */}
            <div className="flex-shrink-0 mx-2">
              <div className="flex items-center space-x-2 md:space-x-3 bg-white rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-sm hover:shadow-md transition-shadow">
                <svg className="w-5 h-5 md:w-6 md:h-6 object-contain text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.64 5.93L21 12l-9.36 6.07v-3.69L16.5 12l-4.86-2.38V5.93z"/>
                </svg>
                <span className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">Twitch</span>
              </div>
            </div>
            
            <div className="flex-shrink-0 mx-2">
              <div className="flex items-center space-x-2 md:space-x-3 bg-white rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-sm hover:shadow-md transition-shadow">
                <svg className="w-5 h-5 md:w-6 md:h-6 object-contain text-red-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">YouTube</span>
              </div>
            </div>
            
            <div className="flex-shrink-0 mx-2">
              <div className="flex items-center space-x-2 md:space-x-3 bg-white rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-sm hover:shadow-md transition-shadow">
                <svg className="w-5 h-5 md:w-6 md:h-6 object-contain text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.197.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">Discord</span>
              </div>
            </div>
          </div>
          
          {/* Duplicate set for seamless scrolling */}
          <div className="flex shrink-0 justify-around [gap:var(--gap)] animate-marquee flex-row group-hover:[animation-play-state:paused]">
            {/* AI Model Partners (Duplicate) */}
            <div className="flex-shrink-0 mx-2">
              <div className="flex items-center space-x-2 md:space-x-3 bg-white rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-sm hover:shadow-md transition-shadow">
                <Image 
                  src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openai.svg" 
                  alt="OpenAI GPT-4" 
                  width={24}
                  height={24}
                  className="w-5 h-5 md:w-6 md:h-6 object-contain"
                />
                <span className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">OpenAI GPT-4</span>
              </div>
            </div>
            
            <div className="flex-shrink-0 mx-2">
              <div className="flex items-center space-x-2 md:space-x-3 bg-white rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-sm hover:shadow-md transition-shadow">
                <Image 
                  src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/flux.svg" 
                  alt="Flux AI" 
                  width={24}
                  height={24}
                  className="w-5 h-5 md:w-6 md:h-6 object-contain"
                />
                <span className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">Flux AI</span>
              </div>
            </div>
            
            <div className="flex-shrink-0 mx-2">
              <div className="flex items-center space-x-2 md:space-x-3 bg-white rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-sm hover:shadow-md transition-shadow">
                <svg className="w-5 h-5 md:w-6 md:h-6 object-contain text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                <span className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">Stable Diffusion</span>
              </div>
            </div>
            
            <div className="flex-shrink-0 mx-2">
              <div className="flex items-center space-x-2 md:space-x-3 bg-white rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-sm hover:shadow-md transition-shadow">
                <svg className="w-5 h-5 md:w-6 md:h-6 object-contain text-purple-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">DALL-E 3</span>
              </div>
            </div>
            
            {/* Streaming Platforms (Duplicate) */}
            <div className="flex-shrink-0 mx-2">
              <div className="flex items-center space-x-2 md:space-x-3 bg-white rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-sm hover:shadow-md transition-shadow">
                <svg className="w-5 h-5 md:w-6 md:h-6 object-contain text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.64 5.93L21 12l-9.36 6.07v-3.69L16.5 12l-4.86-2.38V5.93z"/>
                </svg>
                <span className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">Twitch</span>
              </div>
            </div>
            
            <div className="flex-shrink-0 mx-2">
              <div className="flex items-center space-x-2 md:space-x-3 bg-white rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-sm hover:shadow-md transition-shadow">
                <svg className="w-5 h-5 md:w-6 md:h-6 object-contain text-red-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">YouTube</span>
              </div>
            </div>
            
            <div className="flex-shrink-0 mx-2">
              <div className="flex items-center space-x-2 md:space-x-3 bg-white rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-sm hover:shadow-md transition-shadow">
                <svg className="w-5 h-5 md:w-6 md:h-6 object-contain text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.197.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">Discord</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes marquee {
          from {
            transform: translateX(0%);
          }
          to {
            transform: translateX(-100%);
          }
        }
        
        .animate-marquee {
          animation: marquee var(--duration) linear infinite;
        }
      `}</style>
    </section>
  );
};

export default PartnersSection;
