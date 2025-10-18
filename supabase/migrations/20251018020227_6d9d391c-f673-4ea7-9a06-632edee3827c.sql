-- Remove the insecure private key storage column
ALTER TABLE public.bot_configs DROP COLUMN IF EXISTS wallet_private_key_encrypted;

-- Add a comment explaining the security decision
COMMENT ON TABLE public.bot_configs IS 'Bot configuration without private keys. Private keys are provided at runtime through secure Edge Function and never persisted to database.';