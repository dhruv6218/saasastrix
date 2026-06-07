-- Astrix AI — Full PostgreSQL Schema
-- Run this once to initialize the database

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  dodo_customer_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  timezone VARCHAR(100) DEFAULT 'UTC',
  logo_url TEXT,
  plan VARCHAR(50) DEFAULT 'free',
  dodo_subscription_id VARCHAR(255),
  dodo_customer_id VARCHAR(255),
  product_areas TEXT[] DEFAULT '{"Authentication","API","Core UI","Onboarding","Billing"}',
  segments TEXT[] DEFAULT '{"Enterprise","Mid-Market","SMB","Startup"}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace Members
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('owner','admin','maker','viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Workspace Invites
CREATE TABLE IF NOT EXISTS workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'viewer',
  token VARCHAR(255) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

-- Accounts (customer companies)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  arr NUMERIC(12,2) DEFAULT 0,
  plan VARCHAR(100),
  health_score VARCHAR(10),
  renewal_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS accounts_workspace_idx ON accounts(workspace_id);

-- Signals
CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  source_type VARCHAR(100) NOT NULL DEFAULT 'Manual',
  raw_text TEXT NOT NULL,
  normalized_text TEXT,
  sentiment_label VARCHAR(50),
  severity_label VARCHAR(50),
  category VARCHAR(100),
  product_area VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS signals_workspace_idx ON signals(workspace_id);
CREATE INDEX IF NOT EXISTS signals_account_idx ON signals(account_id);
CREATE INDEX IF NOT EXISTS signals_created_idx ON signals(created_at DESC);

-- Problems
CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'Active',
  severity VARCHAR(50),
  trend VARCHAR(50) DEFAULT 'Stable',
  product_area VARCHAR(100),
  evidence_count INT DEFAULT 0,
  affected_arr NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS problems_workspace_idx ON problems(workspace_id);

-- Signal ↔ Problem join
CREATE TABLE IF NOT EXISTS signal_problems (
  signal_id UUID REFERENCES signals(id) ON DELETE CASCADE NOT NULL,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (signal_id, problem_id)
);

-- Opportunities
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  opportunity_score NUMERIC(5,2) DEFAULT 0,
  demand_score NUMERIC(5,2) DEFAULT 0,
  pain_score NUMERIC(5,2) DEFAULT 0,
  arr_score NUMERIC(5,2) DEFAULT 0,
  trend_score NUMERIC(5,2) DEFAULT 0,
  recommended_action VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS opportunities_workspace_idx ON opportunities(workspace_id);

-- Decisions
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  problem_id UUID REFERENCES problems(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  action VARCHAR(100) NOT NULL DEFAULT 'Build',
  rationale TEXT,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assumptions TEXT[] DEFAULT '{}',
  risks TEXT[] DEFAULT '{}',
  alternatives TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS decisions_workspace_idx ON decisions(workspace_id);

-- Artifacts
CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  decision_id UUID REFERENCES decisions(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  type VARCHAR(100) NOT NULL DEFAULT 'PRD',
  content TEXT DEFAULT '',
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  external_url TEXT,
  external_id VARCHAR(255),
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS artifacts_workspace_idx ON artifacts(workspace_id);
CREATE INDEX IF NOT EXISTS artifacts_decision_idx ON artifacts(decision_id);

-- Launches
CREATE TABLE IF NOT EXISTS launches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  decision_id UUID REFERENCES decisions(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  action VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active','pending_review','complete')),
  launched_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expected_outcome TEXT,
  before_count INT,
  after_count INT,
  pm_verdict VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS launches_workspace_idx ON launches(workspace_id);

-- Activities (Audit log)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  object_type VARCHAR(100),
  object_id VARCHAR(255),
  metadata TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS activities_workspace_idx ON activities(workspace_id);
CREATE INDEX IF NOT EXISTS activities_created_idx ON activities(created_at DESC);
