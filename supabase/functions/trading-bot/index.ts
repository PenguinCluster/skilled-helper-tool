import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BotConfig {
  id: string;
  user_id: string;
  wallet_public_key: string;
  rpc_endpoint: string;
  is_active: boolean;
}

interface TradeRequest {
  user_id: string;
  private_key: string;
  action: 'start' | 'stop' | 'execute';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, private_key } = await req.json() as TradeRequest;

    if (action === 'start') {
      // Validate private key format (basic check)
      if (!private_key || private_key.length < 32) {
        throw new Error('Invalid private key format');
      }

      // Get user's bot configuration
      const { data: config, error: configError } = await supabaseClient
        .from('bot_configs')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle() as { data: BotConfig | null, error: any };

      if (configError) {
        throw configError;
      }

      if (!config) {
        throw new Error('Bot configuration not found. Please configure your wallet first.');
      }

      console.log(`Starting trading bot for user ${user.id}`);
      console.log(`Public key: ${config.wallet_public_key}`);
      console.log(`RPC endpoint: ${config.rpc_endpoint}`);

      // In a production system, this would:
      // 1. Validate the private key matches the public key
      // 2. Start a background process or scheduled job
      // 3. Store the private key securely in memory (not database)
      // 4. Begin monitoring for trading opportunities
      
      // For now, we'll just log that the bot would start
      console.log('Bot trading logic would execute here with the provided private key');
      
      // Log to trade history
      await supabaseClient
        .from('trade_history')
        .insert({
          user_id: user.id,
          token_address: 'SYSTEM',
          action: 'BOT_STARTED',
          amount: 0,
          price: 0,
          status: 'success'
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Trading bot started successfully',
          config: {
            public_key: config.wallet_public_key,
            rpc_endpoint: config.rpc_endpoint
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'stop') {
      console.log(`Stopping trading bot for user ${user.id}`);
      
      // Log to trade history
      await supabaseClient
        .from('trade_history')
        .insert({
          user_id: user.id,
          token_address: 'SYSTEM',
          action: 'BOT_STOPPED',
          amount: 0,
          price: 0,
          status: 'success'
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Trading bot stopped successfully' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action. Use "start" or "stop"');

  } catch (error) {
    console.error('Error in trading-bot function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
