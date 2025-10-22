import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export const TokenSafety = () => {
  const [tokenAddress, setTokenAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [safetyData, setSafetyData] = useState<any>(null);
  const { toast } = useToast();

  const checkSafety = async () => {
    if (!tokenAddress.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a token address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('check-token-safety', {
        body: { token_address: tokenAddress.trim() },
      });

      if (error) throw error;

      if (data.success) {
        setSafetyData(data);
        toast({
          title: "Safety check complete",
          description: `Risk score: ${data.rugpull_risk_score}/100`,
        });
      } else {
        throw new Error(data.error || "Safety check failed");
      }
    } catch (error: any) {
      console.error("Safety check error:", error);
      toast({
        title: "Safety check failed",
        description: error.message || "Failed to check token safety",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSafetyStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'danger': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getSafetyIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'danger': return <XCircle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <Card className="backdrop-blur-glass border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Token Safety Check
        </CardTitle>
        <CardDescription>
          Analyze token safety and rugpull risk
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="safety-token">Token Address</Label>
          <div className="flex gap-2">
            <Input
              id="safety-token"
              placeholder="Enter token address"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={checkSafety} 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Check"
              )}
            </Button>
          </div>
        </div>

        {safetyData && (
          <div className="space-y-3 p-4 rounded-lg border border-white/10 bg-background-secondary/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Safety Status</span>
              <Badge className={getSafetyStatusColor(safetyData.safety_status)}>
                <span className="flex items-center gap-1">
                  {getSafetyIcon(safetyData.safety_status)}
                  {safetyData.safety_status.toUpperCase()}
                </span>
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Risk Score</span>
                <p className="font-semibold">{safetyData.rugpull_risk_score}/100</p>
              </div>
              <div>
                <span className="text-muted-foreground">Liquidity</span>
                <p className="font-semibold">${safetyData.liquidity?.toLocaleString() || 0}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Holders</span>
                <p className="font-semibold">{safetyData.holder_count || 0}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Top Holder %</span>
                <p className="font-semibold">{safetyData.top_holder_percentage?.toFixed(1) || 0}%</p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {safetyData.is_verified && (
                <Badge variant="outline" className="border-green-500/50 text-green-400">
                  ✓ Verified
                </Badge>
              )}
              {safetyData.is_honeypot && (
                <Badge variant="outline" className="border-red-500/50 text-red-400">
                  ⚠ Honeypot
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
