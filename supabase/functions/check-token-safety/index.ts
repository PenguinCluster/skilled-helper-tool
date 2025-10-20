import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SafetyCheckRequest {
  token_address: string;
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

    const { token_address } = await req.json() as SafetyCheckRequest;

    console.log(`Checking safety for token: ${token_address}`);

    const birdeyeApiKey = Deno.env.get('BIRDEYE_API_KEY');
    if (!birdeyeApiKey) {
      console.error('BIRDEYE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Safety check API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get token overview from Birdeye
    const overviewResponse = await fetch(
      `https://public-api.birdeye.so/defi/token_overview?address=${token_address}`,
      {
        headers: {
          'X-API-KEY': birdeyeApiKey,
        },
      }
    );

    if (!overviewResponse.ok) {
      console.error('Birdeye API error:', await overviewResponse.text());
      return new Response(
        JSON.stringify({ error: 'Failed to fetch token data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const overviewData = await overviewResponse.json();
    console.log('Token overview:', overviewData);

    // Get token security info
    const securityResponse = await fetch(
      `https://public-api.birdeye.so/defi/token_security?address=${token_address}`,
      {
        headers: {
          'X-API-KEY': birdeyeApiKey,
        },
      }
    );

    const securityData = securityResponse.ok ? await securityResponse.json() : null;
    console.log('Token security:', securityData);

    // Calculate rugpull risk score (0-100)
    let rugpullRiskScore = 0;
    let safetyStatus = 'safe';

    const liquidity = overviewData.data?.liquidity || 0;
    const holderCount = overviewData.data?.holder || 0;
    const topHolderPct = overviewData.data?.top10HolderPercent || 0;

    // Risk factors
    if (liquidity < 5000) rugpullRiskScore += 30;
    if (holderCount < 100) rugpullRiskScore += 20;
    if (topHolderPct > 50) rugpullRiskScore += 25;
    if (!securityData?.data?.isVerified) rugpullRiskScore += 15;
    if (securityData?.data?.isHoneypot) rugpullRiskScore += 50;

    if (rugpullRiskScore > 50) safetyStatus = 'danger';
    else if (rugpullRiskScore > 30) safetyStatus = 'warning';

    // Store safety analysis
    await supabaseClient
      .from('token_safety')
      .insert({
        token_address,
        safety_status: safetyStatus,
        liquidity_locked: securityData?.data?.liquidityLocked || false,
        contract_verified: securityData?.data?.isVerified || false,
        holder_count: holderCount,
        top_holder_percentage: topHolderPct,
        honeypot_check: securityData?.data?.isHoneypot || false,
        rugpull_risk_score: rugpullRiskScore,
        analysis_source: 'birdeye',
        raw_data: { overview: overviewData, security: securityData },
      });

    return new Response(
      JSON.stringify({
        success: true,
        safety_status: safetyStatus,
        rugpull_risk_score: rugpullRiskScore,
        liquidity,
        holder_count: holderCount,
        top_holder_percentage: topHolderPct,
        is_honeypot: securityData?.data?.isHoneypot || false,
        is_verified: securityData?.data?.isVerified || false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-token-safety function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Safety check failed',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
