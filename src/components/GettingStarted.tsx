import { Terminal, Settings, Rocket, Code } from "lucide-react";

const steps = [
  {
    icon: Code,
    title: "Clone Repository",
    description: "Get started by cloning the Tradie repository from GitHub",
    code: "git clone https://github.com/oboshto/tradie.git\ncd tradie",
  },
  {
    icon: Terminal,
    title: "Install Dependencies",
    description: "Install all required packages using npm",
    code: "npm install",
  },
  {
    icon: Settings,
    title: "Configure Settings",
    description: "Set up your environment variables with your API keys and preferences",
    code: "# Rename .env.copy to .env\n# Add your PRIVATE_KEY, RPC_ENDPOINT, and API keys",
  },
  {
    icon: Rocket,
    title: "Start Trading",
    description: "Launch the bot and let it execute trades based on your strategy",
    code: "npm start",
  },
];

const GettingStarted = () => {
  return (
    <section className="py-24 px-4 relative">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Getting <span className="text-gradient">Started</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Set up Tradie in minutes with these simple steps
          </p>
        </div>

        <div className="space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={index}
                className="glass-card p-6 rounded-xl hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-secondary">Step {index + 1}</span>
                      <h3 className="text-xl font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground">{step.description}</p>
                    <div className="bg-black/40 rounded-lg p-4 border border-border">
                      <pre className="text-sm text-secondary font-mono overflow-x-auto">
                        <code>{step.code}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default GettingStarted;
