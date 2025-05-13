
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { OrganizationStats } from "@/components/home/OrganizationStats";
import { CallToAction } from "@/components/home/CallToAction";
import { Footer } from "@/components/home/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeroSection />
      <FeaturedProjects />
      <OrganizationStats />
      <CallToAction />
      <Footer />
    </div>
  );
}
