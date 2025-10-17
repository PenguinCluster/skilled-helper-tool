import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";

interface Trade {
  id: string;
  token_address: string;
  action: string;
  amount: number;
  price: number;
  status: string;
  created_at: string;
}

const TradeHistory = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrades();

    // Set up realtime subscription
    const channel = supabase
      .channel("trade_history_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trade_history"
        },
        () => {
          loadTrades();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadTrades = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("trade_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setTrades(data);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: "default",
      pending: "secondary",
      failed: "destructive"
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status}</Badge>;
  };

  return (
    <Card className="backdrop-blur-glass border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Trade History
        </CardTitle>
        <CardDescription>
          Recent trades executed by your bot
        </CardDescription>
      </CardHeader>
      <CardContent>
        {trades.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No trades yet. Start your bot to begin trading.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell>
                      <Badge variant={trade.action === "buy" ? "default" : "secondary"}>
                        {trade.action.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {trade.token_address.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{trade.amount}</TableCell>
                    <TableCell>${trade.price}</TableCell>
                    <TableCell>{getStatusBadge(trade.status)}</TableCell>
                    <TableCell className="text-xs">
                      {new Date(trade.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradeHistory;
