import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Wallet } from "lucide-react";
import { z } from "zod";

const walletConfigSchema = z.object({
  publicKey: z.string()
    .trim()
    .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid Solana public key format'),
  rpcEndpoint: z.string()
    .trim()
    .url('Must be a valid HTTPS URL')
    .startsWith('https://', 'RPC endpoint must use HTTPS')
});

const WalletConfig = () => {
  const [publicKey, setPublicKey] = useState("");
  const [rpcEndpoint, setRpcEndpoint] = useState("https://api.mainnet-beta.solana.com");
  const [loading, setLoading] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("bot_configs")
      .select("wallet_public_key, rpc_endpoint")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setPublicKey(data.wallet_public_key);
      setRpcEndpoint(data.rpc_endpoint || "https://api.mainnet-beta.solana.com");
      setHasConfig(true);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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

    // Validate inputs
    const validation = walletConfigSchema.safeParse({
      publicKey,
      rpcEndpoint
    });

    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join(", ");
      toast({
        title: "Invalid input",
        description: errors,
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    const configData = {
      user_id: user.id,
      wallet_public_key: publicKey,
      rpc_endpoint: rpcEndpoint
    };

    const { error } = hasConfig
      ? await supabase
          .from("bot_configs")
          .update(configData)
          .eq("user_id", user.id)
      : await supabase
          .from("bot_configs")
          .insert([configData]);

    if (error) {
      toast({
        title: "Failed to save configuration",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Configuration saved",
        description: "Your wallet settings have been saved. You'll provide your private key when starting the bot."
      });
      setHasConfig(true);
    }

    setLoading(false);
  };

  return (
    <Card className="backdrop-blur-glass border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet Configuration
        </CardTitle>
        <CardDescription>
          Configure your Solana wallet public key and RPC endpoint. Your private key will be requested securely when starting the bot.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="publicKey">Public Key</Label>
            <Input
              id="publicKey"
              placeholder="Your Solana wallet public key"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Base58-encoded Solana address (32-44 characters)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rpcEndpoint">RPC Endpoint</Label>
            <Input
              id="rpcEndpoint"
              placeholder="https://api.mainnet-beta.solana.com"
              value={rpcEndpoint}
              onChange={(e) => setRpcEndpoint(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Must be a secure HTTPS endpoint
            </p>
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {hasConfig ? "Update Configuration" : "Save Configuration"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default WalletConfig;
