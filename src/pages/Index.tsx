import Hero from "@/components/Hero";
import Features from "@/components/Features";
import TechStack from "@/components/TechStack";
import GettingStarted from "@/components/GettingStarted";
import Disclaimer from "@/components/Disclaimer";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <TechStack />
      <GettingStarted />
      <Disclaimer />
      <Footer />
    </main>
  );
};

export default Index;
