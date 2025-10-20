import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, Power, PowerOff } from "lucide-react";
import WalletConfig from "@/components/WalletConfig";
import TradeHistory from "@/components/TradeHistory";
import BotStatus from "@/components/BotStatus";
import { BotSettings } from "@/components/BotSettings";
import { ActivePositions } from "@/components/ActivePositions";

const Dashboard = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background-secondary to-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="relative">
        <nav className="border-b border-white/10 backdrop-blur-glass">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Tradie Bot Dashboard
            </h1>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <WalletConfig />
            <BotStatus />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <BotSettings />
            <ActivePositions />
          </div>
          
          <TradeHistory />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
