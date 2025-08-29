"use client";

import { useRef, useState } from "react";
import type { JSX } from "react";

// <FAQ> component is a list of <Item> component
// Just import the FAQ & add your FAQ content to the const faqList array below.

interface FAQItemProps {
  id: string;
  question: string;
  answer: string;
}

const faqList: FAQItemProps[] = [
  {
    id: "1",
    question: "What is PNGTuberMaker and how does it work?",
    answer: "PNGTuberMaker is an AI-powered tool that lets you create custom PNG avatars for streaming. Just describe your character or upload a reference image, and our AI will generate multiple avatar options — complete with expressions and optional animations. No art skills needed."
  },
  {
    id: "2", 
    question: "Do I need to know how to draw to use PNGTuberMaker?",
    answer: "Not at all! PNGTuberMaker is designed for everyone — from complete beginners to experienced creators. You can simply write a short description (e.g. \"anime cat girl with blue hair\") or upload a reference picture, and the AI handles the rest."
  },
  {
    id: "3",
    question: "Can I upload my own sketches or reference images?",
    answer: "Yes. You can upload sketches, character references, or screenshots. The AI will use them to match your style and keep your character consistent across expressions and animations."
  },
  {
    id: "4",
    question: "What file formats do you export?",
    answer: "We support transparent PNG for static avatars and GIF / MP4 / WebM for animations. Perfect for OBS, Discord, or Twitch overlays."
  },
  {
    id: "5",
    question: "Are the avatars I generate unique and safe to use?",
    answer: "Yes. All avatars are generated from your own inputs and are unique. You get a full license to use them for streaming, content creation, and commercial use."
  },
  {
    id: "6",
    question: "Can I use the avatars commercially?",
    answer: "Absolutely. The Pro plan comes with a full commercial license. You can use your avatars in streams, videos, thumbnails, merchandise, or even resell to clients."
  },
  {
    id: "7",
    question: "What's included in the free plan?",
    answer: "The free plan lets you try PNGTuberMaker with 3 avatar generations per month (with watermark and low resolution). It's perfect for testing the tool before upgrading to Pro to unlock HD export, watermark-free assets, and unlimited expression packs."
  },
  {
    id: "8",
    question: "How long does it take to generate an avatar?",
    answer: "Most avatars are generated in under 1 minute. Expression packs and short animations take 1–3 minutes depending on complexity. You can preview, pick your favorite, and refine instantly."
  }
];

const FaqItem = ({ item }: { item: FAQItemProps }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="faq-item border border-gray-300 rounded-lg bg-white shadow-sm transition-all duration-200 ease-in-out hover:border-gray-600">
      <button 
        className="faq-question w-full text-left p-6 flex items-center justify-between text-gray-800 hover:text-gray-900 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="text-lg font-medium pr-8">{item.question}</span>
        <svg 
          className={`faq-icon w-6 h-6 flex-shrink-0 transform transition-transform duration-200 ${isOpen ? 'rotate-45' : 'rotate-0'}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
      
      <div 
        className={`faq-answer border-t border-gray-300 p-6 text-gray-700 leading-relaxed overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 py-0'
        }`}
      >
        {item.answer}
      </div>
    </div>
  );
};

const FAQ = () => {
  return (
    <section className="bg-gray-50" id="faq">
      <div className="py-20 md:py-24 px-8 max-w-7xl mx-auto">
        <h2 className="text-center text-3xl font-bold text-gray-900 mb-16">
          Frequently Asked Questions
        </h2>
        
        <div className="max-w-4xl mx-auto space-y-4">
          {faqList.map((item) => (
            <FaqItem key={item.id} item={item} />
          ))}
        </div>
      </div>
      
      <style jsx>{`
        .faq-item {
          transition: all 0.2s ease-in-out;
        }
        
        .faq-item:hover {
          border-color: #4B5563;
        }
        
        .faq-answer {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
};

export default FAQ;
