import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Power, PowerOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BotStatus = () => {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);
  const [showPrivateKeyDialog, setShowPrivateKeyDialog] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
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
    if (!isActive) {
      // Starting bot - need private key
      setShowPrivateKeyDialog(true);
    } else {
      // Stopping bot - no private key needed
      await stopBot();
    }
  };

  const stopBot = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error: functionError } = await supabase.functions.invoke('trading-bot', {
        body: { action: 'stop' },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (functionError) throw functionError;

      const { error: updateError } = await supabase
        .from("bot_configs")
        .update({ is_active: false })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setIsActive(false);
      toast({
        title: "Bot Stopped",
        description: "Your trading bot has been stopped"
      });
    } catch (error: any) {
      toast({
        title: "Failed to stop bot",
        description: error.message,
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  const startBot = async () => {
    if (!privateKey || privateKey.length < 32) {
      toast({
        title: "Invalid Private Key",
        description: "Please enter a valid Solana private key",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error: functionError } = await supabase.functions.invoke('trading-bot', {
        body: { 
          action: 'start',
          private_key: privateKey 
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (functionError) throw functionError;

      const { error: updateError } = await supabase
        .from("bot_configs")
        .update({ is_active: true })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setIsActive(true);
      setShowPrivateKeyDialog(false);
      setPrivateKey(""); // Clear the private key from memory
      
      toast({
        title: "Bot Started",
        description: "Your trading bot is now active"
      });
    } catch (error: any) {
      toast({
        title: "Failed to start bot",
        description: error.message,
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  return (
    <>
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
        <CardContent>
          {hasConfig ? (
            <div className="space-y-4">
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
                className="w-full"
                disabled={loading}
                variant={isActive ? "destructive" : "default"}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isActive ? "Stop Bot" : "Start Bot"}
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Please configure your wallet settings first
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPrivateKeyDialog} onOpenChange={setShowPrivateKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Private Key</DialogTitle>
            <DialogDescription>
              Your private key is required to start the trading bot. It will be used securely by the backend service and never stored in the database.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="privateKey">Solana Private Key</Label>
              <Input
                id="privateKey"
                type="password"
                placeholder="Enter your wallet private key"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Your private key is transmitted securely and only held in memory by the trading service.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowPrivateKeyDialog(false);
                  setPrivateKey("");
                }}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={startBot}
                className="flex-1"
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Start Bot
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BotStatus;
