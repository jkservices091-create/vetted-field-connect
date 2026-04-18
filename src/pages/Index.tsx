import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Lanes } from "@/components/site/Lanes";
import { Vetting } from "@/components/site/Vetting";
import { Tiers } from "@/components/site/Tiers";
import { Audiences } from "@/components/site/Audiences";
import { Faq } from "@/components/site/Faq";
import { Waitlist } from "@/components/site/Waitlist";
import { Footer } from "@/components/site/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Lanes />
        <Vetting />
        <Tiers />
        <Audiences />
        <Faq />
        <Waitlist />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
