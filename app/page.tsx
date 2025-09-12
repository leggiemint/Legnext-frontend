import Hero from "@/components/Hero";
import StepSection from "@/components/StepSection";
import FeatureSection from "@/components/FeatureSection";
import MidjourneySection from "@/components/MidjourneySection";
import VideoSection from "@/components/VideoSection";
import AIToolsSection from "@/components/AIToolsSection";
import PricingSection from "@/components/PricingSection";
import FAQ from "@/components/FAQ";
import { defaultFAQList } from "@/components/FAQData";
import TelegramCommunity from "@/components/DiscordCommunity";
import MainLayout from "@/components/MainLayout";
import ImageShowcase from "@/components/ImageShowcase"

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


