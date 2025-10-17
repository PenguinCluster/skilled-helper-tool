import { Code2, Database, Cpu, Boxes } from "lucide-react";

const technologies = [
  {
    category: "Blockchain",
    icon: Boxes,
    items: ["Solana", "Jupiter Exchange", "Web3.js"],
  },
  {
    category: "Data & Analysis",
    icon: Database,
    items: ["CryptoCompare API", "Candlestick Data", "Real-time Market Data"],
  },
  {
    category: "Technical Indicators",
    icon: Cpu,
    items: ["RSI (Relative Strength Index)", "EMA (Exponential Moving Average)", "Bollinger Bands"],
  },
  {
    category: "Development",
    icon: Code2,
    items: ["TypeScript", "Node.js 21+", "Open Source (MIT)"],
  },
];

const TechStack = () => {
  return (
    <section className="py-24 px-4 relative">
      <div className="container mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Built with <span className="text-gradient">Modern Tech</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Leveraging cutting-edge technologies for optimal performance
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {technologies.map((tech, index) => {
            const Icon = tech.icon;
            return (
              <div 
                key={index}
                className="glass-card p-6 rounded-xl hover:bg-white/10 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-4">{tech.category}</h3>
                <ul className="space-y-2">
                  {tech.items.map((item, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TechStack;
