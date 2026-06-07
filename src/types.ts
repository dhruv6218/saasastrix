export interface Workspace {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  logo_url?: string;
  plan: 'free' | 'pro' | 'business' | 'enterprise';
  dodo_subscription_id?: string;
  product_areas: string[];
  segments: string[];
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  is_admin: boolean;
  created_at: string;
}

export interface Signal {
  id: string;
  workspace_id: string;
  account_id?: string;
  source_type: string;
  raw_text: string;
  normalized_text?: string;
  sentiment_label?: string;
  severity_label?: string;
  category?: string;
  product_area?: string;
  created_at: string;
  accounts?: Account;
}

export interface Account {
  id: string;
  workspace_id: string;
  name: string;
  domain?: string;
  arr: number;
  plan?: string;
  health_score?: string;
  renewal_date?: string;
  created_at: string;
}

export interface Problem {
  id: string;
  workspace_id: string;
  title: string;
  description?: string;
  status: string;
  severity?: string;
  trend?: string;
  product_area?: string;
  evidence_count: number;
  affected_arr: number;
  created_at: string;
  signals?: Signal[];
}

export interface Opportunity {
  id: string;
  workspace_id: string;
  problem_id?: string;
  opportunity_score: number;
  demand_score: number;
  pain_score: number;
  arr_score: number;
  trend_score: number;
  recommended_action?: string;
  created_at: string;
  problems?: Problem;
}

export interface Decision {
  id: string;
  workspace_id: string;
  opportunity_id?: string;
  problem_id?: string;
  title: string;
  action: string;
  rationale?: string;
  author_id?: string;
  assumptions?: string;
  risks?: string;
  alternatives?: string;
  created_at: string;
  users?: User;
  problems?: Problem;
}

export interface Artifact {
  id: string;
  workspace_id: string;
  decision_id?: string;
  title: string;
  type: string;
  content: string;
  author_id?: string;
  external_url?: string;
  external_id?: string;
  version: number;
  created_at: string;
  updated_at: string;
  users?: User;
}

export interface Launch {
  id: string;
  workspace_id: string;
  decision_id?: string;
  title: string;
  action?: string;
  status: 'active' | 'pending_review' | 'complete';
  launched_at: string;
  expected_outcome?: string;
  before_count?: number;
  after_count?: number;
  pm_verdict?: string;
  notes?: string;
  created_at: string;
}

export interface Activity {
  id: string;
  workspace_id: string;
  actor_id?: string;
  action: string;
  object_type?: string;
  object_id?: string;
  metadata?: string;
  created_at: string;
  users?: User;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'maker' | 'viewer';
  created_at: string;
  users?: User;
}

export interface WorkspaceInvite {
  id: string;
  workspace_id: string;
  email: string;
  role: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
}
