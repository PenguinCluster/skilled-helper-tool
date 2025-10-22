import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Rocket, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const TokenLaunches = () => {
  const [launches, setLaunches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLaunches();

    // Subscribe to new launches
    const channel = supabase
      .channel('token_launches')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'token_launches'
        },
        (payload) => {
          setLaunches((prev) => [payload.new, ...prev].slice(0, 10));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadLaunches = async () => {
    try {
      const { data, error } = await supabase
        .from('token_launches')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setLaunches(data || []);
    } catch (error) {
      console.error('Failed to load launches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'detected': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'analyzed': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'traded': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  if (loading) {
    return (
      <Card className="backdrop-blur-glass border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Recent Token Launches
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-glass border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          Recent Token Launches
        </CardTitle>
        <CardDescription>
          Newly detected tokens on Solana
        </CardDescription>
      </CardHeader>
      <CardContent>
        {launches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No token launches detected yet
          </div>
        ) : (
          <div className="space-y-3">
            {launches.map((launch) => (
              <div
                key={launch.id}
                className="p-3 rounded-lg border border-white/10 bg-background-secondary/50 hover:bg-background-secondary/80 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold truncate">
                        {launch.token_symbol || 'Unknown'}
                      </span>
                      <Badge className={getStatusColor(launch.status)}>
                        {launch.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {launch.token_address}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(launch.detected_at), { addSuffix: true })}
                    </p>
                  </div>
                  {launch.initial_liquidity && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Liquidity</p>
                      <p className="text-sm font-semibold">
                        ${launch.initial_liquidity.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
