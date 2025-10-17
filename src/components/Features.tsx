import { ArrowLeftRight, TrendingUp, Settings, Zap, Shield, BarChart3 } from "lucide-react";

const features = [
  {
    icon: ArrowLeftRight,
    title: "Efficient Token Swapping",
    description: "Utilizes Jupiter for seamless token exchanges on the Solana blockchain with optimal routing.",
  },
  {
    icon: TrendingUp,
    title: "Advanced Technical Indicators",
    description: "Incorporates RSI, EMA, and Bollinger Bands for sophisticated market analysis and decision-making.",
  },
  {
    icon: Settings,
    title: "Customizable Strategies",
    description: "Configure slippage, stop loss, take profit, and RSI thresholds to match your trading style.",
  },
  {
    icon: Zap,
    title: "Real-Time Processing",
    description: "Fetches market data at user-defined intervals for timely and responsive trading decisions.",
  },
  {
    icon: Shield,
    title: "Transparent & Secure",
    description: "Open-source codebase with extensive logging to monitor all operations and performance.",
  },
  {
    icon: BarChart3,
    title: "Detailed Market Analysis",
    description: "Leverages candlestick data from CryptoCompare to guide intelligent trading decisions.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 px-4 relative">
      <div className="container mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Powerful <span className="text-gradient">Features</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to automate your Solana trading with confidence
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="glass-card p-6 rounded-xl hover:bg-white/10 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
