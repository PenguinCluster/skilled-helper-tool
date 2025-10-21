-- Add trading token configuration to bot_settings
ALTER TABLE public.bot_settings 
ADD COLUMN trading_token_mint text DEFAULT 'So11111111111111111111111111111111111111112';

COMMENT ON COLUMN public.bot_settings.trading_token_mint IS 'Mint address of token used for trading (SOL by default, can be USDC or other SPL tokens)';
