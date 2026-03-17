CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(32) NOT NULL DEFAULT 'user',
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  website_url VARCHAR(255),
  business_category VARCHAR(255),
  risk_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS merchant_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  api_key_hash VARCHAR(255) NOT NULL,
  label VARCHAR(255),
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  transaction_reference VARCHAR(255),
  original_amount NUMERIC(18,4) NOT NULL,
  original_currency CHAR(3) NOT NULL,
  converted_amount NUMERIC(18,4) NOT NULL,
  converted_currency CHAR(3) NOT NULL,
  exchange_rate NUMERIC(18,8) NOT NULL,
  payment_method VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  fraud_score NUMERIC(5,2),
  fraud_risk_level VARCHAR(32),
  fraud_decision VARCHAR(32),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created_at
  ON transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_merchant_created_at
  ON transactions (merchant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_status_created_at
  ON transactions (status, created_at DESC);
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

