import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ERROR_MESSAGES = {
  MISSING_AUTH: 'Authentication required',
  UNAUTHORIZED: 'Invalid or expired authentication',
  INVALID_INPUT: 'Invalid request parameters',
  INVALID_CONFIG: 'Invalid configuration',
  INTERNAL_ERROR: 'An error occurred processing your request'
};

function mapErrorToSafeMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('authorization') || message.includes('auth')) {
      return ERROR_MESSAGES.MISSING_AUTH;
    }
    if (message.includes('unauthorized')) {
      return ERROR_MESSAGES.UNAUTHORIZED;
    }
    if (message.includes('configuration') || message.includes('config')) {
      return ERROR_MESSAGES.INVALID_CONFIG;
    }
    if (message.includes('invalid') || message.includes('format')) {
      return ERROR_MESSAGES.INVALID_INPUT;
    }
  }
  return ERROR_MESSAGES.INTERNAL_ERROR;
}

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

  let userId: string | undefined;

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
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.MISSING_AUTH, success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.UNAUTHORIZED, success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    userId = user.id;

    const { action, private_key } = await req.json() as TradeRequest;

    if (action === 'start') {
      // Validate private key format (basic check)
      if (!private_key || private_key.length < 32) {
        return new Response(
          JSON.stringify({ error: ERROR_MESSAGES.INVALID_INPUT, success: false }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user's bot configuration
      const { data: config, error: configError } = await supabaseClient
        .from('bot_configs')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle() as { data: BotConfig | null, error: any };

      if (configError || !config) {
        return new Response(
          JSON.stringify({ error: ERROR_MESSAGES.INVALID_CONFIG, success: false }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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

    return new Response(
      JSON.stringify({ error: ERROR_MESSAGES.INVALID_INPUT, success: false }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Log detailed error server-side only
    console.error('Error in trading-bot function:', {
      error,
      userId,
      timestamp: new Date().toISOString()
    });
    
    // Return safe generic message to client
    const safeMessage = mapErrorToSafeMessage(error);
    
    return new Response(
      JSON.stringify({ 
        error: safeMessage,
        success: false 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
