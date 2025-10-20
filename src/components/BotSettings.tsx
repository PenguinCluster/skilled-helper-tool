import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Settings } from "lucide-react";

export const BotSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    profit_threshold_percentage: 5.0,
    stop_loss_percentage: -10.0,
    max_investment_per_token: 10.0,
    max_concurrent_positions: 3,
    auto_detect_enabled: false,
    safety_check_enabled: true,
    min_liquidity_usd: 5000,
    max_rugpull_risk_score: 30,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('bot_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setSettings({
        profit_threshold_percentage: Number(data.profit_threshold_percentage),
        stop_loss_percentage: Number(data.stop_loss_percentage),
        max_investment_per_token: Number(data.max_investment_per_token),
        max_concurrent_positions: data.max_concurrent_positions,
        auto_detect_enabled: data.auto_detect_enabled,
        safety_check_enabled: data.safety_check_enabled,
        min_liquidity_usd: Number(data.min_liquidity_usd),
        max_rugpull_risk_score: Number(data.max_rugpull_risk_score),
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('bot_settings')
        .upsert({
          user_id: user.id,
          ...settings,
        });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your bot settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>Bot Settings</CardTitle>
        </div>
        <CardDescription>
          Configure trading parameters and risk management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="profit-threshold">Profit Threshold (%)</Label>
            <Input
              id="profit-threshold"
              type="number"
              step="0.1"
              value={settings.profit_threshold_percentage}
              onChange={(e) => setSettings({ ...settings, profit_threshold_percentage: parseFloat(e.target.value) })}
            />
            <p className="text-sm text-muted-foreground">Sell when profit reaches this percentage</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stop-loss">Stop Loss (%)</Label>
            <Input
              id="stop-loss"
              type="number"
              step="0.1"
              value={settings.stop_loss_percentage}
              onChange={(e) => setSettings({ ...settings, stop_loss_percentage: parseFloat(e.target.value) })}
            />
            <p className="text-sm text-muted-foreground">Sell when loss reaches this percentage</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-investment">Max Investment Per Token (USDC)</Label>
            <Input
              id="max-investment"
              type="number"
              step="1"
              value={settings.max_investment_per_token}
              onChange={(e) => setSettings({ ...settings, max_investment_per_token: parseFloat(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-positions">Max Concurrent Positions</Label>
            <Input
              id="max-positions"
              type="number"
              value={settings.max_concurrent_positions}
              onChange={(e) => setSettings({ ...settings, max_concurrent_positions: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="min-liquidity">Min Liquidity (USD)</Label>
            <Input
              id="min-liquidity"
              type="number"
              step="1000"
              value={settings.min_liquidity_usd}
              onChange={(e) => setSettings({ ...settings, min_liquidity_usd: parseFloat(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-risk">Max Rugpull Risk Score</Label>
            <Input
              id="max-risk"
              type="number"
              step="1"
              min="0"
              max="100"
              value={settings.max_rugpull_risk_score}
              onChange={(e) => setSettings({ ...settings, max_rugpull_risk_score: parseFloat(e.target.value) })}
            />
            <p className="text-sm text-muted-foreground">0-100 scale, lower is safer</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-detect">Auto Token Detection</Label>
              <p className="text-sm text-muted-foreground">Automatically detect and trade new tokens</p>
            </div>
            <Switch
              id="auto-detect"
              checked={settings.auto_detect_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, auto_detect_enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="safety-check">Safety Checks</Label>
              <p className="text-sm text-muted-foreground">Enable rugpull and honeypot detection</p>
            </div>
            <Switch
              id="safety-check"
              checked={settings.safety_check_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, safety_check_enabled: checked })}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
};
