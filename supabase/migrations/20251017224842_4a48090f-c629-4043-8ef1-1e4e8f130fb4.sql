-- Create profiles table for user data
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create profiles automatically on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Bot configuration table
CREATE TABLE public.bot_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  wallet_public_key text NOT NULL,
  wallet_private_key_encrypted text NOT NULL,
  rpc_endpoint text DEFAULT 'https://api.mainnet-beta.solana.com',
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.bot_configs ENABLE ROW LEVEL SECURITY;

-- Bot config policies
CREATE POLICY "Users can view own bot config"
  ON public.bot_configs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bot config"
  ON public.bot_configs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bot config"
  ON public.bot_configs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trade history table
CREATE TABLE public.trade_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  token_address text NOT NULL,
  action text NOT NULL CHECK (action IN ('buy', 'sell')),
  amount numeric NOT NULL,
  price numeric NOT NULL,
  signature text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.trade_history ENABLE ROW LEVEL SECURITY;

-- Trade history policies
CREATE POLICY "Users can view own trade history"
  ON public.trade_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trade history"
  ON public.trade_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bot_configs_updated_at
  BEFORE UPDATE ON public.bot_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();