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

// PngTuber Maker specific FAQ content
export const pngtuberFAQList: FAQItemProps[] = [
  {
    id: "1",
    question: "What do I need to start creating a PNGTuber avatar?",
    answer: "Nothing special — just describe your character idea in text, upload a reference image (optional), or combine both. Our AI will generate avatars instantly."
  },
  {
    id: "2",
    question: "How many avatars do I get per generation?",
    answer: "Each generation gives you 4 variations of a neutral avatar. You can pick your favorite and proceed to generate expressions."
  },
  {
    id: "3",
    question: "What expressions are included in the final download?",
    answer: "You'll receive 6 PNGs total: Neutral, Happy, Angry, Sad, Surprised, and Wink. All with transparent backgrounds, ready for OBS, Twitch, YouTube, and Discord."
  },
  {
    id: "4",
    question: "Can I re-generate if I don't like the first results?",
    answer: "Yes. You can regenerate as many times as your credits allow until you're satisfied with the neutral avatar."
  },
  {
    id: "5",
    question: "In what formats can I download my PNGTuber?",
    answer: "All avatars are delivered as high-resolution PNGs in a ZIP file. Optionally, you can upscale or generate simple GIF/MP4 animations in future updates."
  },
  {
    id: "6",
    question: "Do I need drawing skills to use this tool?",
    answer: "Not at all. Our AI takes care of the artwork. You only need an idea or reference image."
  },
  {
    id: "7",
    question: "Can I use these PNGTubers commercially?",
    answer: "Yes. Pro plans include a commercial license so you can use your avatars for streaming, content creation, and monetized platforms."
  },
  {
    id: "8",
    question: "How long does it take to generate my avatar?",
    answer: "Usually under one minute for the neutral avatar, and a few extra seconds to create the expression pack."
  }
];
