"use client";

const Hero = () => {
  return (
    <div className="relative py-20 bg-white" id="home">
      <div aria-hidden="true" className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20">
        <div className="blur-[106px] h-56 bg-gradient-to-br from-primary to-purple-400"></div>
        <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-8">
        <div className="relative pt-48 ml-auto">
          <div className="w-full text-left">
            <h1 className="text-gray-900 font-bold text-6xl md:text-7xl xl:text-8xl">
              The #1 Way to Access<br/><span className="bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white px-4 py-2 rounded-lg inline-block">Midjourney via API</span>
            </h1>
            <p className="mt-8 text-gray-600 text-lg md:text-xl">
              Integrate the <span className="bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] bg-clip-text text-transparent font-semibold">Midjourney API (unofficial)</span> into your apps and workflows — no Midjourney account required.
            </p>
            
            {/* Feature highlights */}
            <div className="mt-12 flex flex-wrap justify-start gap-6 md:gap-8">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span className="text-gray-700 font-medium">Not discord Automation</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span className="text-gray-700 font-medium">Simple REST API integration</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span className="text-gray-700 font-medium">Production-ready & scalable</span>
              </div>
            </div>
            
            <div className="mt-16 flex flex-wrap justify-start gap-y-4 gap-x-6">
              <button
                onClick={() => window.location.href = '/app'}
                className="relative flex h-11 w-full items-center justify-center px-6 before:absolute before:inset-0 before:rounded-full before:bg-gray-200 before:transition before:duration-300 hover:before:scale-105 active:duration-75 active:before:scale-95 sm:w-max cursor-pointer"
              >
                <svg 
                  className="relative w-5 h-5 mr-2 text-purple-600" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M3 18h18v2H3v-2zm16-4H5l-2-8h18l-2 8zM7 8l1.5-6h7L17 8H7z"/>
                  <path d="M12 4l-1 4h2l-1-4z" fill="currentColor"/>
                </svg>
                <span className="relative text-base font-semibold text-black">
                  Integrate Midjourney
                </span>
              </button>
              <a
                href="https://docs.legnext.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex h-11 w-full items-center justify-center px-6 before:absolute before:inset-0 before:rounded-full before:border before:border-gray-600 before:bg-transparent before:transition before:duration-300 hover:before:scale-105 active:duration-75 active:before:scale-95 sm:w-max"
              >
                <span className="relative text-base font-semibold text-gray-900">
                  View docs
                </span>
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
