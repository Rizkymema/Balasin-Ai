import { HeroSection } from "@/components/sections/hero-section";
import { ModulesSection } from "@/components/sections/modules-section";
import { PlatformSection } from "@/components/sections/platform-section";
import { RoadmapSection } from "@/components/sections/roadmap-section";
import { WorkflowSection } from "@/components/sections/workflow-section";
import { PricingSection } from "@/components/sections/pricing-section";
import { TestimonialSection } from "@/components/sections/testimonial-section";
import { FAQSection } from "@/components/sections/faq-section";
import { CTASection } from "@/components/sections/cta-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PlatformSection />
      <ModulesSection />
      <WorkflowSection />
      <PricingSection />
      <TestimonialSection />
      <FAQSection />
      <RoadmapSection />
      <CTASection />
    </>
  );
}
