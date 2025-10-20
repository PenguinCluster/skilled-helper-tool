import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Activity, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Position {
  id: string;
  token_address: string;
  token_symbol: string;
  entry_price: number;
  current_price: number;
  amount: number;
  usdc_invested: number;
  current_value: number;
  profit_loss_percentage: number;
  opened_at: string;
  last_updated: string;
}

export const ActivePositions = () => {
  const { toast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPositions();
    
    const channel = supabase
      .channel('active_positions_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'active_positions'
      }, () => {
        loadPositions();
      })
      .subscribe();

    const interval = setInterval(refreshPrices, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const loadPositions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('active_positions')
      .select('*')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: false });

    if (!error && data) {
      setPositions(data);
    }
    setLoading(false);
  };

  const refreshPrices = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('monitor-prices');
      
      if (error) throw error;
      
      if (data?.positions) {
        setPositions(data.positions);
        toast({
          title: "Prices Updated",
          description: `Updated ${data.positions.length} positions`,
        });
      }
    } catch (error) {
      console.error('Error refreshing prices:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getProfitColor = (percentage: number) => {
    if (percentage > 0) return "text-green-600";
    if (percentage < 0) return "text-red-600";
    return "text-gray-600";
  };

  const totalInvested = positions.reduce((sum, p) => sum + parseFloat(p.usdc_invested.toString()), 0);
  const totalValue = positions.reduce((sum, p) => sum + parseFloat(p.current_value.toString()), 0);
  const totalProfitLoss = totalValue - totalInvested;
  const totalProfitLossPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle>Active Positions</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshPrices}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <CardDescription>
          Monitor your current trading positions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {positions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No active positions
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total Invested</p>
                <p className="text-lg font-bold">${totalInvested.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="text-lg font-bold">${totalValue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total P/L</p>
                <p className={`text-lg font-bold ${getProfitColor(totalProfitLossPercentage)}`}>
                  {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLoss.toFixed(2)} ({totalProfitLossPercentage.toFixed(2)}%)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {positions.map((position) => (
                <div key={position.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{position.token_symbol || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {position.token_address.slice(0, 4)}...{position.token_address.slice(-4)}
                      </p>
                    </div>
                    <Badge variant={position.profit_loss_percentage >= 0 ? "default" : "destructive"}>
                      {position.profit_loss_percentage >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {position.profit_loss_percentage.toFixed(2)}%
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Entry</p>
                      <p className="font-medium">${parseFloat(position.entry_price.toString()).toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Current</p>
                      <p className="font-medium">${parseFloat(position.current_price.toString()).toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Amount</p>
                      <p className="font-medium">{parseFloat(position.amount.toString()).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Value</p>
                      <p className="font-medium">${parseFloat(position.current_value.toString()).toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-muted-foreground">
                    Opened: {new Date(position.opened_at).toLocaleString()} • 
                    Updated: {new Date(position.last_updated).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
