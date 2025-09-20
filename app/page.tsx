import Hero from "@/components/sections/Hero";
import StepSection from "@/components/ui/StepSection";
import FeatureSection from "@/components/sections/FeatureSection";
import MidjourneySection from "@/components/sections/MidjourneySection";
import VideoSection from "@/components/sections/VideoSection";
import AIToolsSection from "@/components/sections/AIToolsSection";
import PricingSection from "@/components/sections/PricingSection";
import FAQ from "@/components/sections/FAQ";
import { defaultFAQList } from "@/components/sections/FAQData";
import TelegramCommunity from "@/components/sections/DiscordCommunity";
import MainLayout from "@/components/layout/MainLayout";
import ImageShowcase from "@/components/sections/ImageShowcase"

// 移除 force-dynamic 以启用静态化和缓存
// export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <MainLayout>
      <Hero />
      <StepSection />
      <ImageShowcase />
      <FeatureSection />
      <MidjourneySection />
      <VideoSection />
      <AIToolsSection />
      <PricingSection />
      <FAQ faqList={defaultFAQList} />
      <TelegramCommunity />
    </MainLayout>
  );
}


