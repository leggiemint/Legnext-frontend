// FAQ Data for different use cases
// This file contains FAQ content that can be imported and used with the FAQ component

export interface FAQItemProps {
  id: string;
  question: string;
  answer: string;
}

// Default FAQ content (original content)
export const defaultFAQList: FAQItemProps[] = [
  {
    id: "1",
    question: "What is Legnext and how does it work?",
    answer: "Legnext is the #1 Midjourney API Integration Platform that lets developers access Midjourney via API without needing a Midjourney account. Simply make API calls to generate high-quality AI images — reliable, fast, and developer-friendly. No complex setup needed."
  },
  {
    id: "2", 
    question: "Do I need a Midjourney account to use Legnext?",
    answer: "Not at all! Legnext is designed to eliminate the need for individual Midjourney accounts. You can access Midjourney's powerful AI image generation through our reliable API integration — just make API calls and get professional results instantly."
  },
  {
    id: "3",
    question: "Can I integrate Legnext into my existing applications?",
    answer: "Yes! Legnext is designed for seamless integration. Use our developer-friendly API to add Midjourney image generation to your apps, websites, or services. Complete with SDKs, documentation, and code examples for quick implementation."
  },
  {
    id: "4",
    question: "What image formats does the API support?",
    answer: "Our Midjourney API returns high-quality images in standard formats including PNG, JPG, and WebP. Perfect for web applications, mobile apps, and any professional use case requiring AI-generated images."
  },
  {
    id: "5",
    question: "Are the images I generate unique and safe to use?",
    answer: "Yes. All images are generated from your API requests and prompts, making them unique. You get full commercial usage rights for images generated through our Midjourney API integration platform."
  },
  {
    id: "6",
    question: "Can I use the generated images commercially?",
    answer: "Absolutely. Our Professional Midjourney API service comes with full commercial usage rights. Use generated images in your apps, client projects, marketing materials, or any commercial application."
  },
  {
    id: "7",
    question: "What's included in the free tier?",
    answer: "The free tier lets you test our Midjourney API with limited requests per month. It's perfect for evaluating the service before upgrading to Pro for higher limits, priority processing, and advanced features like fast mode generation."
  },
  {
    id: "8",
    question: "How fast is the Midjourney API integration?",
    answer: "Our Midjourney API integration typically processes requests in 30-90 seconds. Fast mode generations complete in 15-30 seconds. Response times depend on complexity and current API load, but we prioritize reliability and speed."
  }
];

// Midjourney API specific FAQ content
export const midjourneyAPIFAQList: FAQItemProps[] = [
  {
    id: "1",
    question: "What do I need to start using the Midjourney API?",
    answer: "Just sign up for a Legnext account and get your API key. No Midjourney account needed — our platform handles all the integration complexity for you."
  },
  {
    id: "2",
    question: "How many API requests do I get per plan?",
    answer: "Plans vary from 100 requests/month on Free tier up to unlimited requests on Enterprise. Each request generates 4 high-quality image variations to choose from."
  },
  {
    id: "3",
    question: "What parameters can I control via the API?",
    answer: "You can control prompts, aspect ratios, stylization levels, quality settings, and generation modes. Full parameter documentation available in our API docs."
  },
  {
    id: "4",
    question: "Can I retry generations if I don't like the results?",
    answer: "Yes. You can make new API calls with modified prompts or parameters until you get the perfect result, subject to your plan limits."
  },
  {
    id: "5",
    question: "In what formats are the generated images returned?",
    answer: "All images are returned as high-resolution URLs in standard formats (PNG/JPG). You can download and use them immediately in your applications."
  },
  {
    id: "6",
    question: "Do I need AI expertise to use this API?",
    answer: "Not at all. Our API abstracts away the complexity. You just send text prompts and receive professional AI-generated images — perfect for developers of all skill levels."
  },
  {
    id: "7",
    question: "Can I use this API for commercial applications?",
    answer: "Yes. Professional plans include full commercial usage rights, making it perfect for client projects, SaaS applications, and business use cases."
  },
  {
    id: "8",
    question: "How fast does the API respond?",
    answer: "Typical response times are 30-90 seconds per generation. Fast mode (available on Pro plans) reduces this to 15-30 seconds for priority processing."
  }
];
