"use client";

import Image from "next/image";

const ComparisonSection = () => {
  return (
    <section className="py-20 md:py-24 bg-gray-50">
      <div className="mx-auto max-w-screen-xl px-8">
        {/* Header Section */}
        <div className="text-left md:text-center">
          <div className="flex items-center justify-start gap-x-3 md:justify-center">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <svg className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-600">4.5 stars from happy creators</span>
          </div>
          
          <h2 className="max-w-2xl mx-auto mt-3 text-2xl font-bold tracking-tight text-[#06b6d4] sm:text-3xl lg:text-[42px] lg:leading-[48px]">
            How Your Ideas Become Professional PNGTubers
          </h2>
          
          <p className="mt-3 text-base font-medium text-gray-600 sm:text-lg md:mx-auto md:max-w-2xl lg:text-xl">
            Save hundreds of dollars and weeks of waiting by using AI to generate your perfect streaming avatar in minutes.
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="mt-8 gap-6 sm:mt-12 md:flex md:justify-center">
          {/* With PNGTuberMaker Card */}
          <div className="w-full rounded-lg border border-[#06b6d4]/15 bg-white p-6 md:p-8 shadow-[0px_0px_75px_0px_rgba(0,0,0,0.07)] lg:max-w-lg">
            <Image 
              src="/images/comparison_left.jpg" 
              alt="PNGTuberMaker AI generation process - Get professional avatars in minutes with just text descriptions" 
              width={400}
              height={300}
              className="w-full rounded-lg ring-1 ring-gray-200"
            />
            
            <div className="mt-6 flex items-center gap-2">
              <p className="text-xl font-bold text-[#06b6d4]">With</p>
              <Image 
                src="/images/logo.svg" 
                alt="PNGTuberMaker logo - Professional AI avatar generator" 
                width={96}
                height={24}
                className="-mb-0.5 h-6 w-auto"
              />
            </div>
            
            <ul className="mt-6 space-y-4 md:space-y-6">
              <li className="flex items-start gap-2 md:gap-4">
                <div className="hidden sm:flex size-8 shrink-0 items-center justify-center rounded-full bg-[#06b6d4]/10">
                  <svg className="w-4 h-4 text-[#06b6d4]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold leading-none tracking-tight text-[#06b6d4]">
                    1. Describe your avatar idea
                    <span className="font-normal text-gray-500 hidden md:inline-flex">(1 minute)</span>
                  </p>
                  <p className="mt-1 text-base font-normal text-gray-600">
                    Type your style or upload a sketch. AI understands your vision perfectly.
                  </p>
                </div>
              </li>
              
              <li className="flex items-start gap-2 md:gap-4">
                <div className="hidden sm:flex size-8 shrink-0 items-center justify-center rounded-full bg-[#06b6d4]/10">
                  <svg className="w-4 h-4 text-[#06b6d4]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold leading-none tracking-tight text-[#06b6d4]">
                    2. AI generates multiple expressions
                    <span className="font-normal text-gray-500 hidden md:inline-flex">(1-2 minutes)</span>
                  </p>
                  <p className="mt-1 text-base font-normal text-gray-600">
                    Smiling, angry, surprised, sad — all auto-generated with consistent style.
                  </p>
                </div>
              </li>
              
              <li className="flex items-start gap-2 md:gap-4">
                <div className="hidden sm:flex size-8 shrink-0 items-center justify-center rounded-full bg-[#06b6d4]/10">
                  <svg className="w-4 h-4 text-[#06b6d4]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold leading-none tracking-tight text-[#06b6d4]">
                    3. Download and go live
                    <span className="font-normal text-gray-500 hidden md:inline-flex">(instant)</span>
                  </p>
                  <p className="mt-1 text-base font-normal text-gray-600">
                    Use your PNG avatar with OBS, Twitch, Discord right away.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* VS Divider */}
          <div className="relative hidden min-h-full w-px shrink-0 bg-gray-300/50 md:block">
            <span className="absolute left-1/2 top-1/2 w-8 -translate-x-1/2 -translate-y-1/2 bg-white py-2 text-center text-sm font-medium text-gray-400 rounded-full border border-gray-200">
              vs
            </span>
          </div>

          {/* Traditional Commission Card */}
          <div className="mt-4 w-full rounded-lg border border-gray-200/50 bg-white p-6 md:p-8 shadow-[0px_0px_75px_0px_rgba(0,0,0,0.07)] md:mt-0 lg:max-w-lg">
            <Image 
              src="/images/comparison_right.jpg" 
              alt="Traditional art commission process - Takes weeks with multiple back-and-forth steps" 
              width={400}
              height={300}
              className="w-full rounded-lg ring-1 ring-gray-200"
            />
            
            <p className="mt-6 text-xl font-bold text-gray-700">
              Traditional Commission
            </p>
            
            <ul className="mt-4 space-y-2 md:space-y-3 text-base font-normal text-gray-600">
              <li className="flex items-center gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="-mb-0.5 size-5 shrink-0 text-red-400">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"></path>
                </svg>
                Find and hire an artist on Fiverr/DeviantArt
              </li>
              
              <li className="flex items-center gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="-mb-0.5 size-5 shrink-0 text-red-400">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"></path>
                </svg>
                Wait for their response and negotiate price
              </li>
              
              <li className="flex items-center gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="-mb-0.5 size-5 shrink-0 text-red-400">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"></path>
                </svg>
                Pay $50–$200+ for one set of PNGs
              </li>
              
              <li className="flex items-center gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="-mb-0.5 size-5 shrink-0 text-red-400">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"></path>
                </svg>
                Wait 1–3 weeks for delivery
              </li>
              
              <li className="flex items-center gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="-mb-0.5 size-5 shrink-0 text-red-400">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"></path>
                </svg>
                Risk inconsistent quality or revisions
              </li>
              
              <li className="flex items-center gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="-mb-0.5 size-5 shrink-0 text-red-400">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"></path>
                </svg>
                Repeat for new expressions or styles
              </li>
            </ul>
            
            {/* Tags */}
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-200">
                Expensive & Slow
              </span>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative mt-8 text-center sm:mt-12">
          <button className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-lg border border-[#06b6d4] bg-[#06b6d4] px-6 pb-3.5 pt-2.5 text-lg font-bold leading-6 text-white shadow-[0_0px_24px_0px_rgba(6,182,212,0.25)] transition-all duration-150 hover:bg-[#06b6d4]/90 disabled:bg-opacity-20 sm:w-auto">
            <span className="hidden md:inline-flex">Create Your PNGTuber Avatar in Minutes</span>
            <span className="md:hidden">Create Your Avatar</span>
          </button>
          
          {/* Trust Badge */}
          <div className="w-full flex items-center justify-center mt-6">
            <div className="mx-auto">
              <div className="max-w-[400px] bg-gray-50 p-4 text-left rounded-md space-y-2 opacity-70 hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-3 relative">
                  <div className="uppercase size-6 shrink-0 rounded-full object-cover font-bold text-xs flex items-center justify-center text-gray-700 bg-gray-300">
                    AK
                  </div>
                  <p className="font-semibold text-[13px] leading-[18px] tracking-tight text-gray-900">
                    Alex Kim - Twitch Streamer
                  </p>
                  <div className="absolute top-1 right-0 flex items-center gap-1">
                    <div className="flex items-center">
                      <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm font-bold leading-5 text-[15px] tracking-tight text-gray-900">
                  Perfect for streaming
                </p>
                
                <p className="text-[13px] font-normal tracking-tight text-gray-600" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  Generated my avatar in 3 minutes and my viewers love it! Way better than spending weeks waiting for commissioned art.
                </p>
                
                <p className="text-[12px] text-gray-500">
                  Date of experience: January 15, 2025
                </p>
              </div>
            </div>
          </div>

          {/* Success Badge */}
          <div className="absolute left-auto top-0 hidden gap-4 lg:flex lg:translate-x-8 lg:items-center xl:translate-x-40">
            <p className="rotate-[-12deg] py-4 text-right font-cursive text-base leading-4 tracking-tight text-gray-600">
              Same day results!
            </p>
            <svg viewBox="0 0 56 51" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="-mt-12 h-12 w-auto text-gray-400">
              <path d="M47.1541 44.8739C44.8708 46.3571 42.6765 47.8339 40.156 49.466C41.3327 50.3929 42.7167 50.2496 43.8436 49.641C47.2242 47.8151 50.6146 45.9006 53.8566 43.7329C55.7149 42.5001 55.6452 40.7462 53.9247 39.9462C51.0771 38.5676 48.1207 37.3728 45.1742 36.0892C45.0061 36.0133 44.7985 35.8963 44.6601 35.9502C44.1164 36.0772 43.6024 36.334 43.0488 36.5497C43.1775 36.9802 43.1084 37.6008 43.3952 37.8C44.3742 38.5213 45.4124 39.1064 46.4012 39.7389C46.9352 40.0964 47.479 40.3651 47.8648 41.2609C46.8367 41.3787 45.7591 41.544 44.731 41.6618C23.5551 43.1825 6.96224 30.8738 3.20946 11.047C2.74404 8.4859 2.59496 5.85814 2.26794 3.24315C2.14903 2.32823 1.98071 1.46082 1.8618 0.545898C1.6443 0.517543 1.41693 0.577842 1.19943 0.549487C0.873343 1.1006 0.319895 1.71201 0.300293 2.28508C0.132791 4.18802 -0.0347098 6.09095 0.0647132 7.97471C0.979821 26.7301 14.2812 41.2539 33.3427 44.0627C36.9909 44.5923 40.8465 44.4473 44.5836 44.5747C45.3745 44.6059 46.1357 44.5072 46.9365 44.4497C47.065 44.4845 47.1342 44.6554 47.1541 44.8739Z"></path>
            </svg>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
