-- ========================================
-- Nexus DEX Aggregator — Supabase Schema
-- ========================================

-- Users
CREATE TABLE IF NOT EXISTS users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address   TEXT UNIQUE NOT NULL,
  ens_name         TEXT,
  total_xp         INTEGER DEFAULT 0,
  level            TEXT DEFAULT 'Bronze',
  referral_code    TEXT UNIQUE,
  referred_by      TEXT REFERENCES users(wallet_address),
  streak_days      INTEGER DEFAULT 0,
  last_swap_date   DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Swaps
CREATE TABLE IF NOT EXISTS swaps (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_wallet    TEXT NOT NULL,
  tx_hash        TEXT UNIQUE NOT NULL,
  token_in       TEXT NOT NULL,
  token_out      TEXT NOT NULL,
  amount_in      NUMERIC NOT NULL,
  amount_out     NUMERIC NOT NULL,
  amount_usd     NUMERIC NOT NULL,
  dex_route      JSONB,
  gas_used       NUMERIC,
  xp_earned      INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- XP Events
CREATE TABLE IF NOT EXISTS xp_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address   TEXT NOT NULL,
  event_type       TEXT NOT NULL,  -- swap, streak, referral, agent, mint, multi_swap, profile
  xp_amount        INTEGER NOT NULL,
  metadata         JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Minted NFTs
CREATE TABLE IF NOT EXISTS minted_nfts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address   TEXT NOT NULL,
  token_id         INTEGER NOT NULL,
  level            TEXT NOT NULL,
  tx_hash          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_wallet  TEXT NOT NULL,
  referred_wallet  TEXT NOT NULL,
  xp_awarded       BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_swaps_wallet     ON swaps(user_wallet);
CREATE INDEX IF NOT EXISTS idx_swaps_created    ON swaps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_xp         ON users(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_referral   ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_xp_wallet        ON xp_events(wallet_address);
CREATE INDEX IF NOT EXISTS idx_minted_wallet    ON minted_nfts(wallet_address);

-- Row Level Security
ALTER TABLE users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE swaps      ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE minted_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals  ENABLE ROW LEVEL SECURITY;

-- Public read for leaderboard
CREATE POLICY "Public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Public read swaps" ON swaps FOR SELECT USING (true);
CREATE POLICY "Public read minted_nfts" ON minted_nfts FOR SELECT USING (true);

-- Service role write (backend only)
CREATE POLICY "Service write users" ON users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write swaps" ON swaps FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write xp_events" ON xp_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write minted_nfts" ON minted_nfts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write referrals" ON referrals FOR ALL USING (auth.role() = 'service_role');
