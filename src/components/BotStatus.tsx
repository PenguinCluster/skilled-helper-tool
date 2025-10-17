import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Power, PowerOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const BotStatus = () => {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadStatus();
    
    // Poll for status updates every 5 seconds
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("bot_configs")
      .select("is_active")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setIsActive(data.is_active);
      setHasConfig(true);
    }
  };

  const handleToggle = async () => {
    if (!hasConfig) {
      toast({
        title: "No configuration found",
        description: "Please configure your wallet first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newStatus = !isActive;

    const { error } = await supabase
      .from("bot_configs")
      .update({ is_active: newStatus })
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Failed to update bot status",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setIsActive(newStatus);
      toast({
        title: newStatus ? "Bot started" : "Bot stopped",
        description: newStatus 
          ? "Your trading bot is now active" 
          : "Your trading bot has been stopped"
      });
    }

    setLoading(false);
  };

  return (
    <Card className="backdrop-blur-glass border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Bot Control</span>
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Start or stop your trading bot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center p-8">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
            isActive ? "bg-green-500/20 shadow-glow" : "bg-gray-500/20"
          } transition-all duration-300`}>
            {isActive ? (
              <Power className="h-12 w-12 text-green-500" />
            ) : (
              <PowerOff className="h-12 w-12 text-gray-500" />
            )}
          </div>
        </div>
        
        <Button
          onClick={handleToggle}
          disabled={loading || !hasConfig}
          className="w-full"
          variant={isActive ? "destructive" : "default"}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isActive ? (
            <PowerOff className="mr-2 h-4 w-4" />
          ) : (
            <Power className="mr-2 h-4 w-4" />
          )}
          {isActive ? "Stop Bot" : "Start Bot"}
        </Button>

        {!hasConfig && (
          <p className="text-sm text-muted-foreground text-center">
            Configure your wallet to enable bot control
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default BotStatus;
