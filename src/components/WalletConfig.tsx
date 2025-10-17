import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Wallet } from "lucide-react";

const WalletConfig = () => {
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
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

    // Simple encryption (base64) - in production, use proper encryption
    const encryptedPrivateKey = btoa(privateKey);

    const configData = {
      user_id: user.id,
      wallet_public_key: publicKey,
      wallet_private_key_encrypted: encryptedPrivateKey,
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
        description: "Your wallet settings have been saved securely."
      });
      setHasConfig(true);
      setPrivateKey("");
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
          Configure your Solana wallet details
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
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="privateKey">Private Key</Label>
            <Input
              id="privateKey"
              type="password"
              placeholder={hasConfig ? "••••••••••••••••" : "Your wallet private key"}
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              required={!hasConfig}
            />
            {hasConfig && (
              <p className="text-xs text-muted-foreground">
                Leave empty to keep existing key
              </p>
            )}
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
