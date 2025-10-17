import { Button } from "@/components/ui/button";
import { Github, ArrowRight, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-trading.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full">
              <TrendingUp className="w-4 h-4 text-secondary" />
              <span className="text-sm text-muted-foreground">Open Source Trading Bot</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Automate Your{" "}
              <span className="text-gradient">Solana Trading</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-xl">
              Tradie is an innovative, open-source trading bot tailored for the Solana blockchain. 
              Leverage advanced technical indicators and automated strategies to trade smarter.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button 
                size="xl" 
                variant="hero"
                asChild
              >
                <a href="https://github.com/oboshto/tradie" target="_blank" rel="noopener noreferrer">
                  <Github className="w-5 h-5" />
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </a>
              </Button>
              
              <Button 
                size="xl" 
                variant="hero-outline"
                asChild
              >
                <a href="#features">
                  Learn More
                </a>
              </Button>
            </div>

            <div className="flex flex-wrap gap-8 pt-4">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-gradient">25+</div>
                <div className="text-sm text-muted-foreground">GitHub Stars</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-gradient">15+</div>
                <div className="text-sm text-muted-foreground">Forks</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-gradient">100%</div>
                <div className="text-sm text-muted-foreground">Open Source</div>
              </div>
            </div>
          </div>

          {/* Right content - Hero image */}
          <div className="relative lg:block hidden">
            <div className="relative glow rounded-2xl overflow-hidden">
              <img 
                src={heroImage} 
                alt="Tradie Trading Bot Interface" 
                className="w-full h-auto rounded-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
