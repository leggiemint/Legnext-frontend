"use client";

import { useState } from "react";

// <FAQ> component is a list of <FAQItem> component
// Now supports custom configuration for different use cases
//
// Usage examples:
// 
// Default FAQ (original style):
// <FAQ faqList={defaultFAQList} />
//
// PngTuber specific FAQ:
// <FAQ 
//   title="Frequently Asked Questions" 
//   faqList={pngtuberFAQList} 
//   variant="pngtuber" 
// />
//
// Custom FAQ with custom styling:
// <FAQ 
//   title="Custom Title" 
//   faqList={customFAQList} 
//   variant="custom" 
//   className="bg-blue-50" 
//   maxWidth="max-w-6xl" 
// />

interface FAQItemProps {
  id: string;
  question: string;
  answer: string;
}

interface FAQProps {
  title?: string;
  faqList: FAQItemProps[];
  variant?: "default" | "pngtuber" | "custom";
  className?: string;
  maxWidth?: string;
}

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

const FAQ = ({ 
  title = "Frequently Asked Questions", 
  faqList, 
  variant = "default",
  className = "",
  maxWidth = "max-w-4xl"
}: FAQProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "pngtuber":
        return ""; // No background for pngtuber variant, inherit from parent
      case "custom":
        return className;
      default:
        return "bg-gray-50";
    }
  };

  const getTitleStyles = () => {
    switch (variant) {
      case "pngtuber":
        return "text-center text-3xl md:text-4xl font-bold text-[#06b6d4] mb-16";
      default:
        return "text-center text-3xl font-bold text-gray-900 mb-16";
    }
  };

  return (
    <section className={getVariantStyles()} id="faq">
      <div className="py-20 md:py-24 px-8 max-w-7xl mx-auto">
        <h2 className={getTitleStyles()}>
          {title}
        </h2>
        
        <div className={`${maxWidth} mx-auto space-y-4`}>
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
