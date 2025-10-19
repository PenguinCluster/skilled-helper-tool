import { Github, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gradient">Tradie</h3>
            <p className="text-muted-foreground">
              Open-source Solana trading bot for automated, sophisticated trading strategies.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-muted-foreground hover:text-secondary transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/oboshto/tradie" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-secondary transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/oboshto/tradie/blob/master/LICENSE" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-secondary transition-colors"
                >
                  License (MIT)
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Community</h4>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="icon"
                asChild
              >
                <a 
                  href="https://github.com/PenguinCluster" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="GitHub Repository"
                >
                  <Github className="w-5 h-5" />
                </a>
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                asChild
              >
                <a 
                  href="https://discord.com/users/910114755346305034" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Join Discord"
                >
                  <MessageSquare className="w-5 h-5" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} Tradie. Open source under MIT License.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
