import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Disclaimer = () => {
  return (
    <section className="py-24 px-4 relative">
      <div className="container mx-auto max-w-4xl">
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <AlertTitle className="text-xl mb-2">Risk Disclaimer</AlertTitle>
          <AlertDescription className="text-base space-y-2">
            <p>
              The use of Tradie and any automated trading software inherently involves financial risks, 
              including the potential loss of funds. The developer(s) of Tradie cannot be held responsible 
              for any financial losses incurred while using the bot.
            </p>
            <p>
              Users should trade with caution and only with funds they can afford to lose. This software 
              is provided "as is", with no guarantee of profitability or performance.
            </p>
            <p className="font-semibold mt-4">
              Always do your own research and never invest more than you can afford to lose.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    </section>
  );
};

export default Disclaimer;
