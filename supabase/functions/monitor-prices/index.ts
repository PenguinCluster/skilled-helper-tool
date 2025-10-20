import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's active positions
    const { data: positions, error: positionsError } = await supabaseClient
      .from('active_positions')
      .select('*')
      .eq('user_id', user.id);

    if (positionsError || !positions || positions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active positions to monitor',
          positions: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const updatedPositions = [];

    for (const position of positions) {
      // Get current price from Jupiter
      const quoteResponse = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${position.token_address}&outputMint=${USDC_MINT}&amount=1000000&slippageBps=50`
      );

      if (quoteResponse.ok) {
        const quoteData = await quoteResponse.json();
        const currentPrice = parseFloat(quoteData.inAmount) / parseFloat(quoteData.outAmount);
        const currentValue = position.amount * currentPrice;
        const profitLossPercentage = ((currentValue - position.usdc_invested) / position.usdc_invested) * 100;

        // Update position
        await supabaseClient
          .from('active_positions')
          .update({
            current_price: currentPrice,
            current_value: currentValue,
            profit_loss_percentage: profitLossPercentage,
            last_updated: new Date().toISOString(),
          })
          .eq('id', position.id);

        updatedPositions.push({
          ...position,
          current_price: currentPrice,
          current_value: currentValue,
          profit_loss_percentage: profitLossPercentage,
        });

        console.log(`Updated position ${position.token_address}: P/L ${profitLossPercentage.toFixed(2)}%`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        positions: updatedPositions,
        message: `Updated ${updatedPositions.length} positions`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in monitor-prices function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Price monitoring failed',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
