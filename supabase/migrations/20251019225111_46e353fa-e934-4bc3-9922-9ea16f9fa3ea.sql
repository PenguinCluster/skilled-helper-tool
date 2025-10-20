-- Create enum for token status
CREATE TYPE token_status AS ENUM ('detected', 'analyzing', 'approved', 'rejected', 'trading', 'exited');

-- Create enum for safety check status
CREATE TYPE safety_status AS ENUM ('safe', 'warning', 'danger', 'unknown');

-- Create table for detected token launches
CREATE TABLE public.token_launches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_address text NOT NULL UNIQUE,
  token_name text,
  token_symbol text,
  source text NOT NULL, -- 'pumpfun', 'moonshot', 'sunpump', 'apestore'
  detected_at timestamp with time zone DEFAULT now(),
  initial_price numeric,
  initial_liquidity numeric,
  status token_status DEFAULT 'detected',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

-- Create table for token safety analysis
CREATE TABLE public.token_safety (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_address text NOT NULL,
  safety_status safety_status DEFAULT 'unknown',
  liquidity_locked boolean,
  contract_verified boolean,
  holder_count integer,
  top_holder_percentage numeric,
  honeypot_check boolean,
  rugpull_risk_score numeric, -- 0-100
  analysis_source text, -- 'dextools', 'birdeye', 'geckoterminal'
  raw_data jsonb,
  analyzed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Create table for active trading positions
CREATE TABLE public.active_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_address text NOT NULL,
  token_symbol text,
  entry_price numeric NOT NULL,
  current_price numeric NOT NULL,
  amount numeric NOT NULL,
  usdc_invested numeric NOT NULL,
  current_value numeric NOT NULL,
  profit_loss_percentage numeric NOT NULL,
  entry_tx_signature text,
  opened_at timestamp with time zone DEFAULT now(),
  last_updated timestamp with time zone DEFAULT now()
);

-- Create table for bot configuration
CREATE TABLE public.bot_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  profit_threshold_percentage numeric DEFAULT 5.0,
  stop_loss_percentage numeric DEFAULT -10.0,
  max_investment_per_token numeric DEFAULT 10.0,
  max_concurrent_positions integer DEFAULT 3,
  auto_detect_enabled boolean DEFAULT false,
  safety_check_enabled boolean DEFAULT true,
  min_liquidity_usd numeric DEFAULT 5000,
  max_rugpull_risk_score numeric DEFAULT 30,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.token_launches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_safety ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for token_launches
CREATE POLICY "Users can view all token launches"
  ON public.token_launches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert token launches"
  ON public.token_launches FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update token launches"
  ON public.token_launches FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for token_safety
CREATE POLICY "Users can view all token safety data"
  ON public.token_safety FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert token safety data"
  ON public.token_safety FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for active_positions
CREATE POLICY "Users can view own positions"
  ON public.active_positions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own positions"
  ON public.active_positions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own positions"
  ON public.active_positions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own positions"
  ON public.active_positions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for bot_settings
CREATE POLICY "Users can view own settings"
  ON public.bot_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.bot_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.bot_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_token_launches_status ON public.token_launches(status);
CREATE INDEX idx_token_launches_token_address ON public.token_launches(token_address);
CREATE INDEX idx_token_safety_token_address ON public.token_safety(token_address);
CREATE INDEX idx_active_positions_user_id ON public.active_positions(user_id);
CREATE INDEX idx_active_positions_token_address ON public.active_positions(token_address);

-- Create trigger for updating bot_settings updated_at
CREATE TRIGGER update_bot_settings_updated_at
  BEFORE UPDATE ON public.bot_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add additional columns to trade_history for enhanced tracking
ALTER TABLE public.trade_history
ADD COLUMN IF NOT EXISTS profit_loss_percentage numeric,
ADD COLUMN IF NOT EXISTS entry_price numeric,
ADD COLUMN IF NOT EXISTS exit_price numeric,
ADD COLUMN IF NOT EXISTS position_id uuid REFERENCES public.active_positions(id);