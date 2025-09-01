"use client";

import Image from "next/image";
import { useState } from "react";

const CharacterSection = () => {
  const [characterInput, setCharacterInput] = useState("");

  const handleCreateCharacter = () => {
    // Handle character creation logic here
    console.log("Creating character:", characterInput);
  };

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-8">
        {/* Success Statistics */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
            185,26 <span className="text-[#4f46e5]">pngtuber</span> already generated for <span className="text-[#22c55e]">1,065</span> happy customers.
          </h2>
        </div>

        {/* Character Design Input and Action */}
        <div className="flex justify-center mb-16">
          <div className="w-full max-w-5xl">
            <div className="flex flex-col h-full">
              <div className="w-full inline-flex tap-highlight-transparent flex-row items-center px-3 gap-3 group min-h-10 transition-all motion-reduce:transition-none duration-300 outline-none h-12 md:h-14 lg:h-16 pl-4 md:pl-8 pr-2 py-0 shadow-[0_4px_30px_rgba(110,207,224,0.25)] bg-white/70 backdrop-blur-xl backdrop-saturate-150 hover:bg-white/80 focus-within:bg-white/80 cursor-text rounded-full border-2 border-[#6366f1] focus-within:border-[#6366f1] relative hover:shadow-[0_8px_40px_rgba(110,207,224,0.35)]">
                <div className="inline-flex w-full items-center h-full box-border">
                  <input 
                    type="text" 
                    id="character-input"
                    placeholder="Design your character (e.g., magical girl with green hair and elf ears)"
                    className="w-full !outline-none focus-visible:outline-none pe-1.5 file:cursor-pointer file:bg-transparent file:border-0 autofill:bg-transparent bg-clip-text text-sm md:text-base font-normal bg-transparent text-black/90 placeholder:text-gray-500/70 placeholder:text-sm md:placeholder:text-base truncate"
                    aria-label="Design your character"
                    value={characterInput}
                    onChange={(e) => setCharacterInput(e.target.value)}
                  />
                  
                  {/* Mobile Button */}
                  <button 
                    className="z-0 group box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent outline-none text-small gap-2 rounded-full transition-transform-colors-opacity motion-reduce:transition-none bg-[#4f46e5] text-white hover:bg-[#4f46e5]/80 flex absolute right-0 justify-center items-center p-0 w-10 h-10 shadow-md sm:hidden min-w-10" 
                    type="button"
                    onClick={handleCreateCharacter}
                  >
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
                      <path d="M224 96l16-32 32-16-32-16-16-32-16 32-32 16 32 16 16 32zM80 160l26.66-53.33L160 80l-53.34-26.67L80 0 53.34 53.33 0 80l53.34 26.67L80 160zm352 128l-26.66 53.33L352 368l53.34 26.67L432 448l26.66-53.33L512 368l-53.34-26.67L432 288zm70.62-193.77L417.77 9.38C411.53 3.12 403.34 0 395.15 0c-8.19 0-16.38 3.12-22.63 9.38L9.38 372.52c-12.5 12.5-12.5 32.76 0 45.25l84.85 84.85c6.25 6.25 14.44 9.37 22.62 9.37 8.19 0 16.38-3.12 22.63-9.37l363.14-363.15c12.5-12.48 12.5-32.75 0-45.24zM359.45 203.46l-50.91-50.91 86.6-86.6 50.91 50.91-86.6 86.6z"/>
                    </svg>
                  </button>
                  
                  {/* Desktop Button */}
                  <button 
                    className="z-0 group relative justify-center box-border appearance-none select-none whitespace-nowrap subpixel-antialiased overflow-hidden tap-highlight-transparent outline-none min-w-20 h-10 rounded-full transition-transform-colors-opacity motion-reduce:transition-none bg-[#4f46e5] text-white hover:bg-[#4f46e5]/80 hidden gap-2 items-center px-4 py-2 text-sm font-medium shadow-lg sm:flex md:px-6 md:py-3 md:text-base" 
                    type="button"
                    onClick={handleCreateCharacter}
                  >
                    <span className="flex gap-2 items-center">
                      <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
                        <path d="M224 96l16-32 32-16-32-16-16-32-16 32-32 16 32 16 16 32zM80 160l26.66-53.33L160 80l-53.34-26.67L80 0 53.34 53.33 0 80l53.34 26.67L80 160zm352 128l-26.66 53.33L352 368l53.34 26.67L432 448l26.66-53.33L512 368l-53.34-26.67L432 288zm70.62-193.77L417.77 9.38C411.53 3.12 403.34 0 395.15 0c-8.19 0-16.38 3.12-22.63 9.38L9.38 372.52c-12.5 12.5-12.5 32.76 0 45.25l84.85 84.85c6.25 6.25 14.44 9.37 22.62 9.37 8.19 0 16.38-3.12 22.63-9.37l363.14-363.15c12.5-12.48 12.5-32.75 0-45.24zM359.45 203.46l-50.91-50.91 86.6-86.6 50.91 50.91-86.6 86.6z"/>
                      </svg>
                      Create Character
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Character Examples Gallery */}
        <div className="relative mt-8">
          <div className="flex gap-4 w-full max-w-5xl mx-auto content-grid">
            {/* Column 1 */}
            <div className="w-1/4">
              <div className="mb-4 content-card group">
                <div className="flex flex-col relative h-auto text-foreground box-border bg-content1 outline-none transition-transform-background motion-reduce:transition-none overflow-hidden rounded-xl shadow transition-all duration-300 group-hover:shadow-xl">
                  <div className="overflow-hidden p-0 bg-white rounded-xl">
                    <div className="overflow-hidden relative">
                      <Image 
                        src="/images/example/1.WEBP" 
                        className="relative z-10 opacity-0 shadow-black/5 data-[loaded=true]:opacity-100 shadow-none transition-transform-opacity motion-reduce:transition-none duration-300 object-cover w-full rounded-xl transition-transform duration-300 group-hover:scale-110" 
                        width={300}
                        height={400}
                        alt="Magical girl character" 
                        style={{ height: 'auto' }} 
                        onLoad={(e) => e.currentTarget.setAttribute('data-loaded', 'true')} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent transition-opacity duration-300 to-black/30 group-hover:opacity-0"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4 content-card group">
                <div className="flex flex-col relative h-auto text-foreground box-border bg-content1 outline-none transition-transform-background motion-reduce:transition-none overflow-hidden rounded-xl shadow transition-all duration-300 group-hover:shadow-xl">
                  <div className="overflow-hidden p-0 bg-white rounded-xl">
                    <div className="overflow-hidden relative">
                      <Image 
                        src="/images/example/2.WEBP" 
                        className="relative z-10 opacity-0 shadow-black/5 data-[loaded=true]:opacity-100 shadow-none transition-transform-opacity motion-reduce:transition-none duration-300 object-cover w-full rounded-xl transition-transform duration-300 group-hover:scale-110" 
                        width={300}
                        height={400}
                        alt="Warrior boy character" 
                        style={{ height: 'auto' }} 
                        onLoad={(e) => e.currentTarget.setAttribute('data-loaded', 'true')} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent transition-opacity duration-300 to-black/30 group-hover:opacity-0"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Column 2 */}
            <div className="w-1/4">
              <div className="mb-4 content-card group">
                <div className="flex flex-col relative h-auto text-foreground box-border bg-content1 outline-none transition-transform-background motion-reduce:transition-none overflow-hidden rounded-xl shadow transition-all duration-300 group-hover:shadow-xl">
                  <div className="overflow-hidden p-0 bg-white rounded-xl">
                    <div className="overflow-hidden relative">
                      <Image 
                        src="/images/example/3.WEBP" 
                        className="relative z-10 opacity-0 shadow-black/5 data-[loaded=true]:opacity-100 shadow-none transition-transform-opacity motion-reduce:transition-none duration-300 object-cover w-full rounded-xl transition-transform duration-300 group-hover:scale-110" 
                        width={300}
                        height={400}
                        alt="Knight character" 
                        style={{ height: 'auto' }} 
                        onLoad={(e) => e.currentTarget.setAttribute('data-loaded', 'true')} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent transition-opacity duration-300 to-black/30 group-hover:opacity-0"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4 content-card group">
                <div className="flex flex-col relative h-auto text-foreground box-border bg-content1 outline-none transition-transform-background motion-reduce:transition-none overflow-hidden rounded-xl shadow transition-all duration-300 group-hover:shadow-xl">
                  <div className="overflow-hidden p-0 bg-white rounded-xl">
                    <div className="overflow-hidden relative">
                      <Image 
                        src="/images/example/4.WEBP" 
                        className="relative z-10 opacity-0 shadow-black/5 data-[loaded=true]:opacity-100 shadow-none transition-transform-opacity motion-reduce:transition-none duration-300 object-cover w-full rounded-xl transition-transform duration-300 group-hover:scale-110" 
                        width={300}
                        height={400}
                        alt="Princess character" 
                        style={{ height: 'auto' }} 
                        onLoad={(e) => e.currentTarget.setAttribute('data-loaded', 'true')} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent transition-opacity duration-300 to-black/30 group-hover:opacity-0"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Column 3 */}
            <div className="w-1/4">
              <div className="mb-4 content-card group">
                <div className="flex flex-col relative h-auto text-foreground box-border bg-content1 outline-none transition-transform-background motion-reduce:transition-none overflow-hidden rounded-xl shadow transition-all duration-300 group-hover:shadow-xl">
                  <div className="overflow-hidden p-0 bg-white rounded-xl">
                    <div className="overflow-hidden relative">
                      <Image 
                        src="/images/example/5.WEBP" 
                        className="relative z-10 opacity-0 shadow-black/5 data-[loaded=true]:opacity-100 shadow-none transition-transform-opacity motion-reduce:transition-none duration-300 object-cover w-full rounded-xl transition-transform duration-300 group-hover:scale-110" 
                        width={300}
                        height={400}
                        alt="Mage character" 
                        style={{ height: 'auto' }} 
                        onLoad={(e) => e.currentTarget.setAttribute('data-loaded', 'true')} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent transition-opacity duration-300 to-black/30 group-hover:opacity-0"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4 content-card group">
                <div className="flex flex-col relative h-auto text-foreground box-border bg-content1 outline-none transition-transform-background motion-reduce:transition-none overflow-hidden rounded-xl shadow transition-all duration-300 group-hover:shadow-xl">
                  <div className="overflow-hidden p-0 bg-white rounded-xl">
                    <div className="overflow-hidden relative">
                      <Image 
                        src="/images/example/6.WEBP" 
                        className="relative z-10 opacity-0 shadow-black/5 data-[loaded=true]:opacity-100 shadow-none transition-transform-opacity motion-reduce:transition-none duration-300 object-cover w-full rounded-xl transition-transform duration-300 group-hover:scale-110" 
                        width={300}
                        height={400}
                        alt="Ninja character" 
                        style={{ height: 'auto' }} 
                        onLoad={(e) => e.currentTarget.setAttribute('data-loaded', 'true')} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent transition-opacity duration-300 to-black/30 group-hover:opacity-0"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Column 4 */}
            <div className="w-1/4">
              <div className="mb-4 content-card group">
                <div className="flex flex-col relative h-auto text-foreground box-border bg-content1 outline-none transition-transform-background motion-reduce:transition-none overflow-hidden rounded-xl shadow transition-all duration-300 group-hover:shadow-xl">
                  <div className="overflow-hidden p-0 bg-white rounded-xl">
                    <div className="overflow-hidden relative">
                      <Image 
                        src="/images/example/7.WEBP" 
                        className="relative z-10 opacity-0 shadow-black/5 data-[loaded=true]:opacity-100 shadow-none transition-transform-opacity motion-reduce:transition-none duration-300 object-cover w-full rounded-xl transition-transform duration-300 group-hover:scale-110" 
                        width={300}
                        height={400}
                        alt="Archer character" 
                        style={{ height: 'auto' }} 
                        onLoad={(e) => e.currentTarget.setAttribute('data-loaded', 'true')} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent transition-opacity duration-300 to-black/30 group-hover:opacity-0"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4 content-card group">
                <div className="flex flex-col relative h-auto text-foreground box-border bg-content1 outline-none transition-transform-background motion-reduce:transition-none overflow-hidden rounded-xl shadow transition-all duration-300 group-hover:shadow-xl">
                  <div className="overflow-hidden p-0 bg-white rounded-xl">
                    <div className="overflow-hidden relative">
                      <Image 
                        src="/images/example/8.WEBP" 
                        className="relative z-10 opacity-0 shadow-black/5 data-[loaded=true]:opacity-100 shadow-none transition-transform-opacity motion-reduce:transition-none duration-300 object-cover w-full rounded-xl transition-transform duration-300 group-hover:scale-110" 
                        width={300}
                        height={400}
                        alt="Wizard character" 
                        style={{ height: 'auto' }} 
                        onLoad={(e) => e.currentTarget.setAttribute('data-loaded', 'true')} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent transition-opacity duration-300 to-black/30 group-hover:opacity-0"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* CTA Button */}
          <div className="flex relative z-20 justify-center mt-8">
            <a href="/">
              <button className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent outline-none min-w-20 h-10 gap-2 transition-transform-colors-opacity motion-reduce:transition-none hover:bg-default/40 px-4 py-2 text-sm text-gray-600 bg-transparent rounded-full border border-gray-200 transition-all duration-300 hover:bg-gray-50 sm:px-6 sm:text-base" type="button">
                Get Started for Free
              </button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CharacterSection;
