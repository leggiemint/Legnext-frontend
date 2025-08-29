import Hero from "@/components/Hero";
import CharacterSection from "@/components/CharacterSection";
import PartnersSection from "@/components/PartnersSection";
import ComparisonSection from "@/components/ComparisonSection";
import AIToolsSection from "@/components/AIToolsSection";
import PricingSection from "@/components/PricingSection";
import FAQ from "@/components/FAQ";
import DiscordCommunity from "@/components/DiscordCommunity";
import MainLayout from "@/components/MainLayout";

export default function HomePage() {
  return (
    <MainLayout>
      <Hero />
      <CharacterSection />
      <PartnersSection />
      <ComparisonSection />
      <AIToolsSection />
      <PricingSection />
      <FAQ />
      <DiscordCommunity />
    </MainLayout>
  );
}


