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

interface BotSettings {
  profit_threshold_percentage: number;
  stop_loss_percentage: number;
  max_investment_per_token: number;
  max_concurrent_positions: number;
  auto_detect_enabled: boolean;
  safety_check_enabled: boolean;
  min_liquidity_usd: number;
  max_rugpull_risk_score: number;
  trading_token_mint: string;
}

async function executeTradingCycle(
  supabaseClient: any,
  userId: string,
  config: BotConfig,
  settings: BotSettings,
  privateKey: string,
  authToken: string
) {
  try {
    console.log('Executing trading cycle...');

    // Check current positions
    const { data: positions } = await supabaseClient
      .from('active_positions')
      .select('*')
      .eq('user_id', userId);

    console.log(`Current positions: ${positions?.length || 0}`);

    // Monitor existing positions
    if (positions && positions.length > 0) {
      for (const position of positions) {
        const profitLoss = position.profit_loss_percentage;
        
        console.log(`Position ${position.token_symbol}: P/L ${profitLoss}%`);

        // Check if we should sell
        if (profitLoss >= settings.profit_threshold_percentage) {
          console.log(`Taking profit on ${position.token_symbol} at ${profitLoss}%`);
          await executeSell(supabaseClient, position, privateKey, userId, authToken);
        } else if (profitLoss <= settings.stop_loss_percentage) {
          console.log(`Stop loss triggered on ${position.token_symbol} at ${profitLoss}%`);
          await executeSell(supabaseClient, position, privateKey, userId, authToken);
        }
      }
    }

    // Look for new trading opportunities if under position limit
    if (settings.auto_detect_enabled && (!positions || positions.length < settings.max_concurrent_positions)) {
      console.log('Looking for new trading opportunities...');
      
      // Get recent token launches
      const { data: launches } = await supabaseClient
        .from('token_launches')
        .select('*')
        .eq('status', 'detected')
        .order('detected_at', { ascending: false })
        .limit(5);

      console.log(`Found ${launches?.length || 0} potential tokens`);

      if (launches && launches.length > 0) {
        for (const launch of launches) {
          // Skip if already have a position
          const hasPosition = positions?.some((p: any) => p.token_address === launch.token_address);
          if (hasPosition) continue;

          // Check safety if enabled
          if (settings.safety_check_enabled) {
            console.log(`Checking safety for ${launch.token_symbol || launch.token_address}`);
            
            const { data: safety } = await supabaseClient
              .from('token_safety')
              .select('*')
              .eq('token_address', launch.token_address)
              .maybeSingle();

            if (!safety) {
              console.log('No safety data available, skipping');
              continue;
            }

            if (safety.rugpull_risk_score > settings.max_rugpull_risk_score) {
              console.log(`Risk score too high: ${safety.rugpull_risk_score}`);
              continue;
            }

            if (safety.safety_status === 'unsafe') {
              console.log('Token marked as unsafe, skipping');
              continue;
            }
          }

          // Check liquidity
          if (launch.initial_liquidity < settings.min_liquidity_usd) {
            console.log(`Liquidity too low: $${launch.initial_liquidity}`);
            continue;
          }

          // Execute buy
          console.log(`Executing buy for ${launch.token_symbol || launch.token_address}`);
          await executeBuy(
            supabaseClient,
            launch,
            settings.max_investment_per_token,
            privateKey,
            userId,
            authToken,
            settings.trading_token_mint
          );

          // Only buy one token per cycle
          break;
        }
      }
    }

    console.log('Trading cycle completed');
  } catch (error) {
    console.error('Error in trading cycle:', error);
  }
}

async function executeBuy(
  supabaseClient: any,
  token: any,
  amount: number,
  privateKey: string,
  userId: string,
  authToken: string,
  tradingTokenMint: string
) {
  try {
    const tokenSymbol = tradingTokenMint === "So11111111111111111111111111111111111111112" ? "SOL" : "USDC";
    console.log(`Buying ${token.token_symbol} for ${amount} ${tokenSymbol}`);

    // Call jupiter-swap function
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/jupiter-swap`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token_address: token.token_address,
        action: 'buy',
        amount: amount,
        private_key: privateKey,
        input_token_mint: tradingTokenMint,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log(`Buy successful: ${result.signature}`);
      
      // Create active position
      await supabaseClient
        .from('active_positions')
        .insert({
          user_id: userId,
          token_address: token.token_address,
          token_symbol: token.token_symbol,
          amount: result.outputAmount,
          entry_price: result.price,
          usdc_invested: amount,
          current_price: result.price,
          current_value: amount,
          profit_loss_percentage: 0,
          entry_tx_signature: result.signature,
        });

      // Update token launch status
      await supabaseClient
        .from('token_launches')
        .update({ status: 'traded', user_id: userId })
        .eq('token_address', token.token_address);
    } else {
      console.error('Buy failed:', result.error);
    }
  } catch (error) {
    console.error('Error executing buy:', error);
  }
}

async function executeSell(
  supabaseClient: any,
  position: any,
  privateKey: string,
  userId: string,
  authToken: string
) {
  try {
    console.log(`Selling ${position.token_symbol}`);

    // Call jupiter-swap function
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/jupiter-swap`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token_address: position.token_address,
        action: 'sell',
        amount: position.amount,
        private_key: privateKey,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log(`Sell successful: ${result.signature}`);
      
      // Remove from active positions
      await supabaseClient
        .from('active_positions')
        .delete()
        .eq('id', position.id);

      // Update trade history with final P/L
      await supabaseClient
        .from('trade_history')
        .update({
          status: 'completed',
          exit_price: result.price,
          profit_loss_percentage: position.profit_loss_percentage,
        })
        .eq('position_id', position.id)
        .eq('action', 'buy');
    } else {
      console.error('Sell failed:', result.error);
    }
  } catch (error) {
    console.error('Error executing sell:', error);
  }
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

      // Get user's bot settings
      const { data: settings } = await supabaseClient
        .from('bot_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!settings) {
        return new Response(
          JSON.stringify({ error: 'Please configure bot settings first', success: false }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Bot settings loaded:', settings);

      // Update bot config to active
      await supabaseClient
        .from('bot_configs')
        .update({ is_active: true })
        .eq('user_id', user.id);

      // Start the trading loop
      await executeTradingCycle(supabaseClient, user.id, config, settings, private_key, token);
      
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
      
      // Update bot config to inactive
      await supabaseClient
        .from('bot_configs')
        .update({ is_active: false })
        .eq('user_id', user.id);
      
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
