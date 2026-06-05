export type Plan = 'free' | 'starter' | 'growth' | 'scale';

const PLAN_RANK: Record<Plan, number> = {
  free: 0,
  starter: 1,
  growth: 2,
  scale: 3,
};

export const PLAN_LIMITS: Record<Plan, {
  signals: number;
  accounts: number;
  problems: number;
  visibleOpps: number;
  compareMode: boolean;
  activeLaunches: number;
  completedLaunches: number;
  aiCalls: number;
  multipleWorkspaces: boolean;
}> = {
  free: {
    signals: 200,
    accounts: 50,
    problems: 10,
    visibleOpps: 5,
    compareMode: false,
    activeLaunches: 1,
    completedLaunches: 3,
    aiCalls: 100,
    multipleWorkspaces: false,
  },
  starter: {
    signals: 5000,
    accounts: 1000,
    problems: 50,
    visibleOpps: Infinity,
    compareMode: true,
    activeLaunches: 5,
    completedLaunches: Infinity,
    aiCalls: 1500,
    multipleWorkspaces: false,
  },
  growth: {
    signals: 25000,
    accounts: 5000,
    problems: 200,
    visibleOpps: Infinity,
    compareMode: true,
    activeLaunches: 15,
    completedLaunches: Infinity,
    aiCalls: 4000,
    multipleWorkspaces: true,
  },
  scale: {
    signals: Infinity,
    accounts: Infinity,
    problems: Infinity,
    visibleOpps: Infinity,
    compareMode: true,
    activeLaunches: Infinity,
    completedLaunches: Infinity,
    aiCalls: 10000,
    multipleWorkspaces: true,
  },
};

export const usePlan = () => {
  const plan: Plan = 'free';
  const limits = PLAN_LIMITS[plan];
  const isAtLeast = (required: Plan) => PLAN_RANK[plan] >= PLAN_RANK[required];

  return { plan, limits, isAtLeast };
};
