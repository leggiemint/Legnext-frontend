"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const AIToolsSection = () => {
  const [activeTab, setActiveTab] = useState("image_generation");
  const sectionsRef = useRef<{ [key: string]: HTMLElement | null }>({});

  const tabs = [
    {
      id: "image_generation",
      label: "Generate",
      desktopLabel: "Image Generation",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="9" cy="9" r="2"/>
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
        </svg>
      ),
      color: "text-[#8b5cf6]",
      bgColor: "bg-[#8b5cf6]/10"
    },
    {
      id: "updating_image",
      label: "Update",
      desktopLabel: "Updating Image",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
      ),
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      id: "enhance_image",
      label: "Enhance",
      desktopLabel: "Enhance Image",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ),
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      id: "video_generation",
      label: "Video",
      desktopLabel: "Video Generation",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="23 7 16 12 23 17 23 7"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
      ),
      color: "text-indigo-600",
      bgColor: "bg-indigo-100"
    }
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    const section = sectionsRef.current[tabId];
    if (section) {
      section.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  useEffect(() => {
    const observerOptions = {
      rootMargin: '-20% 0px -80% 0px',
      threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          setActiveTab(sectionId);
        }
      });
    }, observerOptions);

    // Use a timeout to ensure refs are set
    const timeoutId = setTimeout(() => {
      Object.values(sectionsRef.current).forEach(section => {
        if (section) {
          sectionObserver.observe(section);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      sectionObserver.disconnect();
    };
  }, []);

  return (
    <section className="py-20 md:py-24 bg-white" id="ai-tools">
      <div className="w-full max-w-7xl mx-auto px-8">
        {/* Header Section */}
        <div className="text-center mb-8 md:mb-12">
          <p className="text-xs md:text-sm font-semibold uppercase text-[#8b5cf6] mb-2">
            Midjourney API Features
          </p>
          <h2 className="text-black font-sans mb-4 md:mb-5 text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
            Create AI Images & Videos in Minutes — Not Discord Account
          </h2>
          <p className="text-black font-medium mb-6 md:mb-8 text-base md:text-xl leading-relaxed text-gray-600 max-w-3xl mx-auto">
            Generate high-quality images, videos, and creative content instantly with Midjourney API. No complex setup. No waiting. Just production-ready results.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 md:mb-8">
          <div className="sticky top-0 z-10 backdrop-blur-sm md:border-b border-gray-200 mb-8 md:mb-12 bg-white/95">
            <div className="px-3 py-3 md:px-4 md:py-4">
              {/* Mobile Tabs */}
              <div className="md:hidden">
                <div className="flex gap-2 flex-wrap justify-center">
                  {tabs.map((tab) => (
                    <button 
                      key={tab.id}
                      className={`nav-tab-mobile flex items-center space-x-2 px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                        activeTab === tab.id 
                          ? 'bg-[#8b5cf6] text-white shadow-md' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                      }`}
                      onClick={() => handleTabClick(tab.id)}
                    >
                      <span className="text-xs">
                        {tab.icon}
                      </span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop Tabs */}
              <div className="hidden md:flex gap-2 justify-center flex-wrap">
                {tabs.map((tab) => (
                  <button 
                    key={tab.id}
                    className={`nav-tab-desktop flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'bg-[#8b5cf6] text-white shadow-lg' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                    onClick={() => handleTabClick(tab.id)}
                  >
                    <span className="text-xl">
                      {tab.icon}
                    </span>
                    <span>{tab.desktopLabel}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Feature Content Sections */}
          <div className="space-y-8 md:space-y-14">
            {/* AI Image Generation */}
            <section 
              id="image_generation" 
              className="scroll-mt-32 md:scroll-mt-40"
              ref={(el) => { if (el) sectionsRef.current.image_generation = el; }}
            >
              <div className="block bg-white rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                <div className="block md:grid md:grid-cols-2 md:gap-0">
                  {/* Image */}
                  <div className="relative bg-gradient-to-br from-[#4f46e5]/10 to-purple-50 w-full h-48 sm:h-56 md:h-64 lg:h-80 xl:h-96 flex items-center justify-center overflow-hidden md:p-6 lg:p-8">
                    <Image 
                      src="/images/example/0_640_n(1).WEBP" 
                      alt="AI Avatar Generation - From text or reference image" 
                      width={400}
                      height={400}
                      className="w-full h-full rounded-lg object-cover object-center"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-4 md:p-8 flex flex-col justify-center">
                    <div className="flex items-center space-x-3 mb-3 md:mb-4">
                      <div className={`w-6 h-6 md:w-8 md:h-8 ${tabs[0].bgColor} rounded-lg flex items-center justify-center ${tabs[0].color} flex-shrink-0`}>
                        {tabs[0].icon}
                      </div>
                      <h3 className="text-lg md:text-2xl font-bold text-gray-900 leading-tight">Image Generation</h3>
                    </div>
                    
                    <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 leading-relaxed">
                    Familiar /imagine workflow, powered by Midjourney’s style. Use prompts, reference images, and parameters to bring your ideas to life.
                    </p>

                    {/* Feature Grid */}
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-2 md:gap-3 mb-4 md:mb-6">
                      <div className="flex items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 text-xs md:text-sm font-medium">/imagine</span>
                      </div>
                      
                      <div className="flex items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 text-xs md:text-sm font-medium">/reroll</span>
                      </div>
                      
                      <div className="flex items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 text-xs md:text-sm font-medium">/blend</span>
                      </div>
                      
                      <div className="flex items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 text-xs md:text-sm font-medium">/faceswap</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center text-[#8b5cf6] font-medium text-sm md:text-base">
                        ✅ A seamless Midjourney experience
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Updating Image */}
            <section 
              id="updating_image" 
              className="scroll-mt-32 md:scroll-mt-40"
              ref={(el) => { if (el) sectionsRef.current.updating_image = el; }}
            >
              <div className="block bg-white rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                <div className="block md:grid md:grid-cols-2 md:gap-0">
                  {/* Image */}
                  <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 w-full h-48 sm:h-56 md:h-64 lg:h-80 xl:h-96 flex items-center justify-center overflow-hidden md:p-6 lg:p-8 md:order-2">
                    <Image 
                      src="/images/example/0_640_n(4).WEBP" 
                      alt="Expression Pack Auto-Creation - Multiple emotions in one click" 
                      width={400}
                      height={400}
                      className="w-full h-full rounded-lg object-cover object-center"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-4 md:p-8 flex flex-col justify-center md:order-1">
                    <div className="flex items-center space-x-3 mb-3 md:mb-4">
                      <div className={`w-6 h-6 md:w-8 md:h-8 ${tabs[1].bgColor} rounded-lg flex items-center justify-center ${tabs[1].color} flex-shrink-0`}>
                        {tabs[1].icon}
                      </div>
                      <h3 className="text-lg md:text-2xl font-bold text-gray-900 leading-tight">Updating Image</h3>
                    </div>
                    
                    <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 leading-relaxed">
                    Modify and enhance your generated images using — upscale, create variations, inpaint, outpaint, or pan
                    </p>

                    {/* Feature Grid */}
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-2 md:gap-3 mb-4 md:mb-6">
                      <div className="flex items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 text-xs md:text-sm font-medium">/upscale</span>
                      </div>
                      
                      <div className="flex items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 text-xs md:text-sm font-medium">/variations</span>
                      </div>
                      
                      <div className="flex items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 text-xs md:text-sm font-medium">/inpaint</span>
                      </div>
                      
                      <div className="flex items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 text-xs md:text-sm font-medium">/outpaint</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center text-purple-600 font-medium text-sm md:text-base">
                        ✅ All while preserving the original composition and style
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Enhance Image */}
            <section 
              id="enhance_image" 
              className="scroll-mt-32 md:scroll-mt-40"
              ref={(el) => { if (el) sectionsRef.current.enhance_image = el; }}
            >
              <div className="block bg-white rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                <div className="block md:grid md:grid-cols-2 md:gap-0">
                  {/* Image */}
                  <div className="relative bg-gradient-to-br from-green-50 to-teal-50 w-full h-48 sm:h-56 md:h-64 lg:h-80 xl:h-96 flex items-center justify-center overflow-hidden md:p-6 lg:p-8">
                    <Image 
                      src="/images/example/0_640_n(13).WEBP" 
                      alt="AI Image Enhancement - Improve and refine your images" 
                      width={400}
                      height={400}
                      className="w-full h-full rounded-lg object-cover object-center"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-4 md:p-8 flex flex-col justify-center">
                    <div className="flex items-center space-x-3 mb-3 md:mb-4">
                      <div className={`w-6 h-6 md:w-8 md:h-8 ${tabs[2].bgColor} rounded-lg flex items-center justify-center ${tabs[2].color} flex-shrink-0`}>
                        {tabs[2].icon}
                      </div>
                      <h3 className="text-lg md:text-2xl font-bold text-gray-900 leading-tight">Enhance Image</h3>
                    </div>
                    
                    <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 leading-relaxed">
                      Improve and refine your images with AI-powered enhancement tools. Boost quality, adjust lighting, remove imperfections, and optimize for any use case.
                    </p>

                    {/* Feature Grid */}
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-2 md:gap-3 mb-4 md:mb-6">
                      <div className="flex items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 text-xs md:text-sm font-medium">/remove-background</span>
                      </div>
                      
                      <div className="flex items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 text-xs md:text-sm font-medium">/retexture</span>
                      </div>
                      
                      <div className="flex items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 text-xs md:text-sm font-medium">/enhance</span>
                      </div>
                      
                      <div className="flex items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 text-xs md:text-sm font-medium">/remix</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center text-green-600 font-medium text-sm md:text-base">
                        ✅ Transform any image into professional quality
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Video Generation */}
            <section 
              id="video_generation" 
              className="scroll-mt-32 md:scroll-mt-40"
              ref={(el) => { if (el) sectionsRef.current.video_generation = el; }}
            >
              <div className="block bg-white rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                <div className="block md:grid md:grid-cols-2 md:gap-0">
                  {/* Video */}
                  <div className="relative bg-gradient-to-br from-indigo-50 to-blue-50 w-full h-48 sm:h-56 md:h-64 lg:h-80 xl:h-96 flex items-center justify-center overflow-hidden md:p-6 lg:p-8 md:order-2">
                    <video 
                      src="/images/example/Explore.webm" 
                      autoPlay 
                      loop 
                      muted 
                      playsInline 
                      className="w-full h-full rounded-lg object-cover object-center"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-4 md:p-8 flex flex-col justify-center md:order-1">
                    <div className="flex items-center space-x-3 mb-3 md:mb-4">
                      <div className={`w-6 h-6 md:w-8 md:h-8 ${tabs[3].bgColor} rounded-lg flex items-center justify-center ${tabs[3].color} flex-shrink-0`}>
                        {tabs[3].icon}
                      </div>
                      <h3 className="text-lg md:text-2xl font-bold text-gray-900 leading-tight">Video Generation</h3>
                    </div>
                    
                    <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 leading-relaxed">
                      Create stunning AI videos from text prompts or images. Generate motion graphics, animations, and dynamic content with Midjourney&apos;s latest video models.
                    </p>

                    {/* Feature Grid */}
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-2 md:gap-3 mb-4 md:mb-6">
                      <div className="flex items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 text-xs md:text-sm font-medium">/video-diffusion</span>
                      </div>
                      
                      <div className="flex items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 text-xs md:text-sm font-medium">/extend-video</span>
                      </div>
                      
                      <div className="flex items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 text-xs md:text-sm font-medium">/video-upscale</span>
                      </div>
                      
                      <div className="flex items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 text-xs md:text-sm font-medium">Video Model V1</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center text-indigo-600 font-medium text-sm md:text-base">
                        ✅ Create dynamic videos with AI-powered generation
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIToolsSection;
