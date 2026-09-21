import AboutHero from "./components/AboutHero";
import MissionSection from "./components/MissionSection";
import ValuesSection from "./components/ValuesSection";
import FounderSection from "./components/FounderSection";
import AboutCta from "./components/AboutCta";

/** About Lifebookz — hero, mission, values, the founder, and a closing CTA. */
export function AboutPage() {
  return (
    <div className="relative overflow-hidden bg-background text-foreground">
      <AboutHero />
      <MissionSection />
      <ValuesSection />
      <FounderSection />
      <AboutCta />
    </div>
  );
}

export default AboutPage;
