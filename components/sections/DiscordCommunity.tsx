"use client";

import Link from "next/link";

const TelegramCommunity = () => {
  return (
    <section className="py-20 md:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Main Heading */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Be Part of Our Telegram Group!
          </h2>
        </div>

        {/* Subtitle */}
        <div className="mb-12">
          <p className="text-gray-600 text-lg">
            Our last group reset, but we&apos;re rebuilding stronger. Come be part of it!
          </p>
        </div>

                    {/* Telegram Button */}
        <div className="flex justify-center">
          <Link
            href="https://t.me/+PsZ-Qun0hKViNjZl"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center justify-center"
          >
            {/* Telegram Icon with Hover Effect */}
            <div className="relative bg-blue-500 hover:bg-blue-600 rounded-full p-4 transition-all duration-300 transform group-hover:scale-110 shadow-lg group-hover:shadow-xl">
              {/* Telegram SVG Icon */}
              <svg 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="text-white drop-shadow-sm"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.787L21.815 4.922c.314-1.272-.472-1.849-1.15-1.205z"/>
              </svg>
              
              {/* Pulse Effect */}
              <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-25"></div>
            </div>
          </Link>
        </div>

      </div>
      
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.8);
          }
        }
        
        .group:hover .pulse-glow {
          animation: pulse-glow 2s infinite;
        }
      `}</style>
    </section>
  );
};

export default TelegramCommunity;
