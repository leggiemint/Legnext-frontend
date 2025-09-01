"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const AIToolsSection = () => {
  const [activeTab, setActiveTab] = useState("avatar_generation");
  const sectionsRef = useRef<{ [key: string]: HTMLElement | null }>({});

  const tabs = [
    {
      id: "avatar_generation",
      label: "Generate",
      desktopLabel: "AI Avatar Generation",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12l2 2 4-4"/>
          <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.12 0 4.04.74 5.57 1.97"/>
        </svg>
      ),
      color: "text-[#4f46e5]",
      bgColor: "bg-[#4f46e5]/10"
    },
    {
      id: "expression_pack",
      label: "Expressions",
      desktopLabel: "Expression Pack Auto-Creation",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1"/>
          <circle cx="19" cy="12" r="1"/>
          <circle cx="5" cy="12" r="1"/>
        </svg>
      ),
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      id: "animation_stills",
      label: "Animate",
      desktopLabel: "Animation from Stills",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 9 5 12 1.8-5.2L21 14Z"/>
          <path d="M7.2 2.2 8 5.1"/>
          <path d="m5.1 8-2.9-.8"/>
          <path d="M14 4.1 12 6"/>
          <path d="m6 12-1.9 2"/>
        </svg>
      ),
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      id: "smart_upscale",
      label: "Upscale",
      desktopLabel: "Smart Upscale & Variations",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="7.5,4.21 12,6.81 16.5,4.21"/>
          <polyline points="7.5,19.79 7.5,14.6 3,12"/>
          <polyline points="21,12 16.5,14.6 16.5,19.79"/>
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

    Object.values(sectionsRef.current).forEach(section => {
      if (section) {
        sectionObserver.observe(section);
      }
    });

    return () => {
      sectionObserver.disconnect();
    };
  }, []);

  return (
    <section className="py-20 md:py-24 bg-gray-50" id="ai-tools">
      <div className="w-full max-w-7xl mx-auto px-8">
        {/* Header Section */}
        <div className="text-center mb-8 md:mb-12">
          <p className="text-xs md:text-sm font-semibold uppercase text-[#4f46e5] mb-2">
            AI Tools for Streamers
          </p>
          <h2 className="text-black font-sans mb-4 md:mb-5 text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
            Create Your PNGTuber Avatar in Minutes — Not Weeks
          </h2>
          <p className="text-black font-medium mb-6 md:mb-8 text-base md:text-xl leading-relaxed text-gray-600 max-w-3xl mx-auto">
            Generate avatars, expressions, and animations instantly with AI. No commissions. No waiting. Just stream-ready results.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 md:mb-8">
          <div className="sticky top-0 z-10 backdrop-blur-sm md:border-b border-gray-200 mb-8 md:mb-12 bg-gray-50/95">
            <div className="px-3 py-3 md:px-4 md:py-4">
              {/* Mobile Tabs */}
              <div className="md:hidden">
                <div className="flex gap-2 flex-wrap justify-center">
                  {tabs.map((tab) => (
                    <button 
                      key={tab.id}
                      className={`nav-tab-mobile flex items-center space-x-2 px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                        activeTab === tab.id 
                          ? 'bg-[#4f46e5] text-white shadow-md' 
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
                        ? 'bg-[#4f46e5] text-white shadow-lg' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                    onClick={() => handleTabClick(tab.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {tab.icon.props.children}
                    </svg>
                    <span>{tab.desktopLabel}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Feature Content Sections */}
          <div className="space-y-8 md:space-y-14">
            {/* AI Avatar Generation */}
            <section 
              id="avatar_generation" 
              className="scroll-mt-32 md:scroll-mt-40"
              ref={(el) => { sectionsRef.current.avatar_generation = el; }}
            >
              <div className="block bg-white rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                <div className="block md:grid md:grid-cols-2 md:gap-0">
                  {/* Image */}
                  <div className="relative bg-gradient-to-br from-[#4f46e5]/10 to-purple-50 w-full h-48 sm:h-56 md:h-64 lg:h-80 xl:h-96 flex items-center justify-center overflow-hidden md:p-6 lg:p-8">
                    <Image 
                      src="/images/AITools/input_1.jpg" 
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
                      <h3 className="text-lg md:text-2xl font-bold text-gray-900 leading-tight">AI Avatar Generation</h3>
                    </div>
                    
                    <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 leading-relaxed">
                      Turn text or sketches into a professional avatar. Upload a description or reference, get 4 unique characters with transparent backgrounds, ready for OBS/Discord.
                    </p>

                    {/* Feature Grid */}
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-2 md:gap-3 mb-4 md:mb-6">
                      <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                        <div className="text-[#4f46e5] flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10,9 9,9 8,9"/>
                          </svg>
                        </div>
                        <span className="text-gray-700 text-xs md:text-sm font-medium">Text descriptions</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                        <div className="text-[#4f46e5] flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="9" cy="9" r="2"/>
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                          </svg>
                        </div>
                        <span className="text-gray-700 text-xs md:text-sm font-medium">Reference images</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                        <div className="text-[#4f46e5] flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                          </svg>
                        </div>
                        <span className="text-gray-700 text-xs md:text-sm font-medium">4 candidates generated</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                        <div className="text-[#4f46e5] flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12l5 5l10 -10"/>
                          </svg>
                        </div>
                        <span className="text-gray-700 text-xs md:text-sm font-medium">Transparent background</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center text-[#4f46e5] font-medium text-sm md:text-base">
                        ✅ No artist needed, minutes to your unique character
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Expression Pack Auto-Creation */}
            <section 
              id="expression_pack" 
              className="scroll-mt-32 md:scroll-mt-40"
              ref={(el) => { sectionsRef.current.expression_pack = el; }}
            >
              <div className="block bg-white rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                <div className="block md:grid md:grid-cols-2 md:gap-0">
                  {/* Image */}
                  <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 w-full h-48 sm:h-56 md:h-64 lg:h-80 xl:h-96 flex items-center justify-center overflow-hidden md:p-6 lg:p-8 md:order-2">
                    <Image 
                      src="/images/AITools/input_2.png" 
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
                      <h3 className="text-lg md:text-2xl font-bold text-gray-900 leading-tight">Expression Pack Auto-Creation</h3>
                    </div>
                    
                    <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 leading-relaxed">
                      All emotions, one click. Happy, angry, sad, surprised — AI generates consistent expressions for your avatar without hiring an artist.
                    </p>

                    {/* Feature Grid */}
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-2 md:gap-3 mb-4 md:mb-6">
                      <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                        <div className="text-purple-600 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                          </svg>
                        </div>
                        <span className="text-gray-700 text-xs md:text-sm font-medium">Auto-generate emotions</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                        <div className="text-purple-600 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v20M2 12h20"/>
                          </svg>
                        </div>
                        <span className="text-gray-700 text-xs md:text-sm font-medium">Character consistency</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                        <div className="text-purple-600 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 12l2 2 4-4"/>
                            <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.12 0 4.04.74 5.57 1.97"/>
                          </svg>
                        </div>
                        <span className="text-gray-700 text-xs md:text-sm font-medium">Manual selection</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                        <div className="text-purple-600 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                          </svg>
                        </div>
                        <span className="text-gray-700 text-xs md:text-sm font-medium">Variation options</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center text-purple-600 font-medium text-sm md:text-base">
                        ✅ Skip commissioning multiple expressions, save time & cost
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Animation from Stills */}
            <section 
              id="animation_stills" 
              className="scroll-mt-32 md:scroll-mt-40"
              ref={(el) => { sectionsRef.current.animation_stills = el; }}
            >
              <div className="block bg-white rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                <div className="block md:grid md:grid-cols-2 md:gap-0">
                  {/* Video */}
                  <div className="relative bg-gradient-to-br from-green-50 to-teal-50 w-full h-48 sm:h-56 md:h-64 lg:h-80 xl:h-96 flex items-center justify-center overflow-hidden md:p-6 lg:p-8">
                    <video 
                      src="/images/AITools/input_3.webm" 
                      autoPlay 
                      loop 
                      muted 
                      playsInline 
                      className="w-full h-full rounded-lg object-cover object-center"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-4 md:p-8 flex flex-col justify-center">
                    <div className="flex items-center space-x-3 mb-3 md:mb-4">
                      <div className={`w-6 h-6 md:w-8 md:h-8 ${tabs[2].bgColor} rounded-lg flex items-center justify-center ${tabs[2].color} flex-shrink-0`}>
                        {tabs[2].icon}
                      </div>
                      <h3 className="text-lg md:text-2xl font-bold text-gray-900 leading-tight">Animation from Stills</h3>
                    </div>
                    
                    <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 leading-relaxed">
                      Bring your avatar to life. AI adds blinking, mouth movements, and emotional transitions. Export as MP4/GIF/WebM for instant streaming use.
                    </p>

                    {/* Feature Grid */}
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-2 md:gap-3 mb-4 md:mb-6">
                      <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                        <div className="text-green-600 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </div>
                        <span className="text-gray-700 text-xs md:text-sm font-medium">Blinking animations</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                        <div className="text-green-600 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                            <line x1="12" y1="19" x2="12" y2="23"/>
                            <line x1="8" y1="23" x2="16" y2="23"/>
                          </svg>
                        </div>
                        <span className="text-gray-700 text-xs md:text-sm font-medium">Mouth movements</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                        <div className="text-green-600 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"/>
                            <path d="M8 9h8"/>
                            <path d="M8 13h6"/>
                          </svg>
                        </div>
                        <span className="text-gray-700 text-xs md:text-sm font-medium">Emotion transitions</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                        <div className="text-green-600 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
                            <path d="M7 11l5-5 5 5"/>
                            <path d="M12 6v10"/>
                          </svg>
                        </div>
                        <span className="text-gray-700 text-xs md:text-sm font-medium">Multiple export formats</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center text-green-600 font-medium text-sm md:text-base">
                        ✅ Instant broadcast-ready content for Twitch/YouTube
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Smart Upscale & Variations */}
            <section 
              id="smart_upscale" 
              className="scroll-mt-32 md:scroll-mt-40"
              ref={(el) => { sectionsRef.current.smart_upscale = el; }}
            >
              <div className="block bg-white rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                <div className="block md:grid md:grid-cols-2 md:gap-0">
                  {/* Video */}
                  <div className="relative bg-gradient-to-br from-indigo-50 to-blue-50 w-full h-48 sm:h-56 md:h-64 lg:h-80 xl:h-96 flex items-center justify-center overflow-hidden md:p-6 lg:p-8 md:order-2">
                    <video 
                      src="/images/AITools/input_4.webm" 
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
                      <h3 className="text-lg md:text-2xl font-bold text-gray-900 leading-tight">Smart Upscale & Variations</h3>
                    </div>
                    
                    <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 leading-relaxed">
                      Polish until perfect. Upscale for HD quality, explore endless variations, and refine until you find your unique streaming persona.
                    </p>

                    {/* Feature Grid */}
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-2 md:gap-3 mb-4 md:mb-6">
                      <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                        <div className="text-indigo-600 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/>
                            <line x1="8" y1="7" x2="8" y2="3"/>
                            <line x1="16" y1="7" x2="16" y2="3"/>
                          </svg>
                        </div>
                        <span className="text-gray-700 text-xs md:text-sm font-medium">High-resolution upscale</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                        <div className="text-indigo-600 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                          </svg>
                        </div>
                        <span className="text-gray-700 text-xs md:text-sm font-medium">Quality preservation</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                        <div className="text-indigo-600 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                          </svg>
                        </div>
                        <span className="text-gray-700 text-xs md:text-sm font-medium">Generate variations</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                        <div className="text-indigo-600 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                        </div>
                        <span className="text-gray-700 text-xs md:text-sm font-medium">Iterative refinement</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center text-indigo-600 font-medium text-sm md:text-base">
                        ✅ Perfect your unique character through continuous refinement
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
