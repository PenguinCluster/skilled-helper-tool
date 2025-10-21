import { createClient } from 'npm:@supabase/supabase-js@2';
import { Connection, Keypair, VersionedTransaction } from 'npm:@solana/web3.js';
import bs58 from 'npm:bs58';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SwapRequest {
  token_address: string;
  action: 'buy' | 'sell';
  amount: number;
  private_key: string;
  slippage_bps?: number;
  input_token_mint?: string;
}

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

    const { token_address, action, amount, private_key, slippage_bps = 50, input_token_mint } = await req.json() as SwapRequest;

    // Get user's wallet config
    const { data: config } = await supabaseClient
      .from('bot_configs')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!config) {
      return new Response(
        JSON.stringify({ error: 'Wallet not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate private key
    const privateKeyBytes = bs58.decode(private_key);
    const keypair = Keypair.fromSecretKey(privateKeyBytes);

    if (keypair.publicKey.toBase58() !== config.wallet_public_key) {
      return new Response(
        JSON.stringify({ error: 'Private key does not match wallet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const connection = new Connection(config.rpc_endpoint);
    
    // Default to USDC if not specified
    const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const SOL_MINT = 'So11111111111111111111111111111111111111112';
    const tradingTokenMint = input_token_mint || USDC_MINT;
    
    const inputMint = action === 'buy' ? tradingTokenMint : token_address;
    const outputMint = action === 'buy' ? token_address : tradingTokenMint;
    
    // Convert amount to lamports (6 decimals for USDC, 9 for SOL)
    const decimals = tradingTokenMint === SOL_MINT ? 9 : 6;
    const amountLamports = Math.floor(amount * Math.pow(10, decimals));

    console.log(`Getting Jupiter quote for ${action}: ${amountLamports} from ${inputMint} to ${outputMint}`);

    // Get quote from Jupiter API
    const quoteResponse = await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountLamports}&slippageBps=${slippage_bps}`
    );

    if (!quoteResponse.ok) {
      const errorText = await quoteResponse.text();
      console.error('Jupiter quote error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to get quote from Jupiter' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const quoteData = await quoteResponse.json();
    console.log('Jupiter quote:', quoteData);

    // Get swap transaction
    const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: quoteData,
        userPublicKey: keypair.publicKey.toBase58(),
        wrapAndUnwrapSol: true,
      }),
    });

    if (!swapResponse.ok) {
      const errorText = await swapResponse.text();
      console.error('Jupiter swap error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create swap transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { swapTransaction } = await swapResponse.json();

    // Deserialize and sign transaction
    const transactionBuf = Uint8Array.from(atob(swapTransaction), c => c.charCodeAt(0));
    const transaction = VersionedTransaction.deserialize(transactionBuf);
    transaction.sign([keypair]);

    // Send transaction
    const signature = await connection.sendTransaction(transaction);
    console.log('Transaction sent:', signature);

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');
    
    if (confirmation.value.err) {
      console.error('Transaction failed:', confirmation.value.err);
      throw new Error('Transaction failed');
    }

    console.log('Transaction confirmed:', signature);

    // Calculate output amount with correct decimals
    const outputDecimals = action === 'buy' ? 6 : decimals; // Output is always in the "output" token's decimals
    const outputAmount = parseFloat(quoteData.outAmount) / Math.pow(10, outputDecimals);
    const priceImpact = quoteData.priceImpactPct || 0;
    const price = parseFloat(quoteData.inAmount) / parseFloat(quoteData.outAmount);

    // Record trade in history
    await supabaseClient
      .from('trade_history')
      .insert({
        user_id: user.id,
        token_address,
        action: action.toUpperCase(),
        amount: outputAmount,
        price,
        status: 'success',
        signature,
      });

    return new Response(
      JSON.stringify({
        success: true,
        signature,
        outputAmount,
        price,
        priceImpact,
        message: `${action === 'buy' ? 'Bought' : 'Sold'} ${outputAmount} tokens`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in jupiter-swap function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Swap failed',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
