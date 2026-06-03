import { useState, useEffect, useCallback } from 'react';
import * as mocks from './mockData';
import { Signal, Account, Problem, Opportunity, Decision, Artifact, Launch, TeamMember, WorkspaceInvite } from '../types';

const delay = (ms = 500) => new Promise(r => setTimeout(r, ms));

export const mockDb = {
  signals: [...mocks.MOCK_SIGNALS] as Signal[],
  accounts: [...mocks.MOCK_ACCOUNTS] as Account[],
  problems: [...mocks.MOCK_PROBLEMS] as Problem[],
  opportunities: [...mocks.MOCK_OPPORTUNITIES] as Opportunity[],
  decisions: [...mocks.MOCK_DECISIONS] as Decision[],
  artifacts: [...mocks.MOCK_ARTIFACTS] as Artifact[],
  launches: [...mocks.MOCK_LAUNCHES] as Launch[],
  members: [...mocks.MOCK_MEMBERS] as TeamMember[],
  invites: [] as WorkspaceInvite[],
  activities: [...mocks.MOCK_ACTIVITIES] as typeof mocks.MOCK_ACTIVITIES,
  productAreas: [...(mocks.MOCK_WORKSPACE.product_areas)] as string[],
  segments: [...(mocks.MOCK_WORKSPACE.segments)] as string[],
};

export const triggerUpdate = () => window.dispatchEvent(new Event('data-updated'));

export const api = {
  signals: {
    list: async (wsId: string, opts?: any) => {
      await delay(300);
      let res = mockDb.signals.filter(s => s.workspace_id === wsId);
      if (opts?.globalFilter) {
        const q = opts.globalFilter.toLowerCase();
        res = res.filter(s =>
          s.raw_text?.toLowerCase().includes(q) ||
          s.accounts?.name?.toLowerCase().includes(q) ||
          s.product_area?.toLowerCase().includes(q)
        );
      }
      if (opts?.severity) res = res.filter(s => s.severity_label === opts.severity);
      if (opts?.sentiment) res = res.filter(s => s.sentiment_label === opts.sentiment);
      if (opts?.product_area) res = res.filter(s => s.product_area === opts.product_area);
      if (opts?.account_id) res = res.filter(s => s.account_id === opts.account_id);
      if (opts?.date_from) res = res.filter(s => new Date(s.created_at) >= new Date(opts.date_from));
      if (opts?.date_to) res = res.filter(s => new Date(s.created_at) <= new Date(opts.date_to + 'T23:59:59'));
      if (opts?.sorting?.length > 0) {
        const sort = opts.sorting[0];
        res.sort((a: any, b: any) => {
          if (a[sort.id] < b[sort.id]) return sort.desc ? 1 : -1;
          if (a[sort.id] > b[sort.id]) return sort.desc ? -1 : 1;
          return 0;
        });
      }
      const total = res.length;
      if (opts?.page && opts?.limit) {
        const start = (opts.page - 1) * opts.limit;
        res = res.slice(start, start + opts.limit);
      }
      return { rows: res, total };
    },
    create: async (data: Partial<Signal>) => {
      await delay();
      const account = data.account_id ? mockDb.accounts.find(a => a.id === data.account_id) || null : null;
      const newItem = { ...data, id: `sig-${Date.now()}`, created_at: new Date().toISOString(), accounts: account } as Signal;
      mockDb.signals = [newItem, ...mockDb.signals];
      mockDb.activities = [
        { id: `act-${Date.now()}`, action: 'Added signal manually', object_type: 'Signal', object_id: newItem.id, actor: 'Demo User', metadata: data.raw_text?.substring(0, 50) || '', time: new Date().toISOString() },
        ...mockDb.activities
      ];
      triggerUpdate();
      return newItem;
    },
    get: async (id: string) => {
      await delay();
      const signal = mockDb.signals.find(s => s.id === id);
      const account = signal?.account_id ? mockDb.accounts.find(a => a.id === signal.account_id) : null;
      return { ...signal, accounts: account };
    },
    update: async (id: string, data: Partial<Signal>) => {
      await delay();
      const idx = mockDb.signals.findIndex(s => s.id === id);
      if (idx === -1) throw new Error('Signal not found');
      const account = data.account_id !== undefined
        ? (data.account_id ? mockDb.accounts.find(a => a.id === data.account_id) || null : null)
        : mockDb.signals[idx].accounts;
      mockDb.signals[idx] = { ...mockDb.signals[idx], ...data, accounts: account as Account };
      mockDb.activities = [
        { id: `act-${Date.now()}`, action: 'Updated signal classification', object_type: 'Signal', object_id: id, actor: 'Demo User', metadata: `Severity: ${data.severity_label || 'unchanged'}`, time: new Date().toISOString() },
        ...mockDb.activities
      ];
      triggerUpdate();
      return mockDb.signals[idx];
    }
  },
  accounts: {
    list: async (wsId: string, opts?: any) => {
      await delay(300);
      let res = mockDb.accounts.filter(a => a.workspace_id === wsId);
      if (opts?.globalFilter) {
        const q = opts.globalFilter.toLowerCase();
        res = res.filter(a => a.name.toLowerCase().includes(q) || (a.domain && a.domain.toLowerCase().includes(q)));
      }
      if (opts?.plan) res = res.filter(a => a.plan === opts.plan);
      if (opts?.arr_min !== undefined) res = res.filter(a => a.arr >= opts.arr_min);
      if (opts?.arr_max !== undefined) res = res.filter(a => a.arr <= opts.arr_max);
      if (opts?.health === 'healthy') res = res.filter(a => parseInt(a.health_score || '0') >= 75);
      else if (opts?.health === 'warning') res = res.filter(a => { const s = parseInt(a.health_score || '0'); return s >= 50 && s < 75; });
      else if (opts?.health === 'at_risk') res = res.filter(a => parseInt(a.health_score || '0') < 50 && parseInt(a.health_score || '0') > 0);
      if (opts?.sorting?.length > 0) {
        const sort = opts.sorting[0];
        res.sort((a: any, b: any) => {
          if (a[sort.id] < b[sort.id]) return sort.desc ? 1 : -1;
          if (a[sort.id] > b[sort.id]) return sort.desc ? -1 : 1;
          return 0;
        });
      }
      const total = res.length;
      if (opts?.page && opts?.limit) {
        const start = (opts.page - 1) * opts.limit;
        res = res.slice(start, start + opts.limit);
      }
      return { rows: res, total };
    },
    create: async (data: Partial<Account>) => {
      await delay();
      const newItem = { ...data, id: `acc-${Date.now()}`, created_at: new Date().toISOString(), signal_count: 0 } as Account;
      mockDb.accounts = [newItem, ...mockDb.accounts];
      triggerUpdate();
      return newItem;
    },
    get: async (id: string) => {
      await delay();
      const account = mockDb.accounts.find(a => a.id === id);
      const signals = mockDb.signals.filter(s => s.account_id === id);
      const problems = mockDb.problems.filter(p => signals.some(s => s.normalized_text?.includes(p.title)));
      return { account, signals, problems };
    }
  },
  problems: {
    list: async (wsId: string) => {
      await delay();
      return mockDb.problems.filter(p => p.workspace_id === wsId);
    },
    get: async (id: string) => {
      await delay();
      const problem = mockDb.problems.find(p => p.id === id);
      const signals = mockDb.signals.filter(s => {
        if (id === 'prob-1') return s.product_area === 'Authentication';
        if (id === 'prob-2') return s.product_area === 'API';
        if (id === 'prob-3') return s.product_area === 'Core UI';
        return false;
      });
      const accounts = mockDb.accounts.slice(0, 2);
      return { problem, signals, accounts };
    },
    create: async (data: Partial<Problem>) => {
      await delay();
      const newItem = { ...data, id: `prob-${Date.now()}`, created_at: new Date().toISOString(), evidence_count: 0, affected_arr: 0, status: 'Active', trend: 'Stable' } as Problem;
      mockDb.problems = [newItem, ...mockDb.problems];
      mockDb.activities = [
        { id: `act-${Date.now()}`, action: 'Created problem', object_type: 'Problem', object_id: newItem.id, actor: 'Demo User', metadata: data.title || '', time: new Date().toISOString() },
        ...mockDb.activities
      ];
      triggerUpdate();
      return newItem;
    },
    unlinkSignal: async (problemId: string, signalId: string) => {
      await delay(300);
      triggerUpdate();
    }
  },
  opportunities: {
    list: async (wsId: string) => {
      await delay();
      const opps = mockDb.opportunities.filter(o => o.workspace_id === wsId);
      return opps.map(opp => {
        const prob = mockDb.problems.find(p => p.id === opp.problem_id);
        const relSignals = mockDb.signals.filter(s => s.product_area === prob?.product_area);
        const accountIds = [...new Set(relSignals.map(s => s.account_id).filter(Boolean))] as string[];
        const topAccounts = accountIds.slice(0, 3)
          .map(id => mockDb.accounts.find(a => a.id === id))
          .filter(Boolean)
          .map(a => ({ name: a!.name, arr: a!.arr }));
        return { ...opp, top_accounts: topAccounts };
      });
    },
    get: async (id: string) => {
      await delay();
      return mockDb.opportunities.find(o => o.id === id);
    }
  },
  decisions: {
    list: async (wsId: string) => {
      await delay();
      return mockDb.decisions.filter(d => d.workspace_id === wsId);
    },
    get: async (id: string) => {
      await delay();
      return mockDb.decisions.find(d => d.id === id);
    },
    create: async (data: Partial<Decision>) => {
      await delay();
      const newItem = { ...data, id: `dec-${Date.now()}`, created_at: new Date().toISOString(), users: { full_name: 'Demo User' } } as Decision;
      mockDb.decisions = [newItem, ...mockDb.decisions];
      mockDb.activities = [
        { id: `act-${Date.now()}`, action: 'Committed decision', object_type: 'Decision', object_id: newItem.id, actor: 'Demo User', metadata: `${data.action} · ${data.title}`, time: new Date().toISOString() },
        ...mockDb.activities
      ];
      triggerUpdate();
      return newItem;
    },
    update: async (id: string, data: Partial<Decision>) => {
      await delay();
      mockDb.decisions = mockDb.decisions.map(d => d.id === id ? { ...d, ...data } : d);
      triggerUpdate();
    }
  },
  artifacts: {
    list: async (wsId: string) => {
      await delay();
      return mockDb.artifacts.filter(a => a.workspace_id === wsId);
    },
    create: async (data: Partial<Artifact>) => {
      await delay();
      const newItem = { ...data, id: `art-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), users: { full_name: 'Demo User' } } as Artifact;
      mockDb.artifacts = [newItem, ...mockDb.artifacts];
      mockDb.activities = [
        { id: `act-${Date.now()}`, action: 'Generated artifact', object_type: 'Artifact', object_id: newItem.id, actor: 'Demo User', metadata: `${data.type} via AI`, time: new Date().toISOString() },
        ...mockDb.activities
      ];
      triggerUpdate();
      return newItem;
    },
    update: async (id: string, data: Partial<Artifact>) => {
      await delay();
      mockDb.artifacts = mockDb.artifacts.map(a => a.id === id ? { ...a, ...data, updated_at: new Date().toISOString() } : a);
      triggerUpdate();
    },
    get: async (id: string) => {
      await delay();
      return mockDb.artifacts.find(a => a.id === id);
    }
  },
  launches: {
    list: async (wsId: string) => {
      await delay();
      return mockDb.launches.filter(l => l.workspace_id === wsId);
    },
    create: async (data: Partial<Launch>) => {
      await delay();
      const newItem = { ...data, id: `launch-${Date.now()}`, created_at: new Date().toISOString(), status: 'active' } as Launch;
      mockDb.launches = [newItem, ...mockDb.launches];
      mockDb.activities = [
        { id: `act-${Date.now()}`, action: 'Logged launch', object_type: 'Launch', object_id: newItem.id, actor: 'Demo User', metadata: data.title || '', time: new Date().toISOString() },
        ...mockDb.activities
      ];
      triggerUpdate();
      return newItem;
    },
    update: async (id: string, data: Partial<Launch>) => {
      await delay();
      mockDb.launches = mockDb.launches.map(l => l.id === id ? { ...l, ...data } : l);
      if (data.pm_verdict) {
        mockDb.activities = [
          { id: `act-${Date.now()}`, action: `Submitted verdict: ${data.pm_verdict}`, object_type: 'Launch', object_id: id, actor: 'Demo User', metadata: data.pm_verdict, time: new Date().toISOString() },
          ...mockDb.activities
        ];
      }
      triggerUpdate();
    }
  },
  team: {
    list: async (wsId: string) => {
      await delay();
      return {
        members: mockDb.members.filter(m => m.workspace_id === wsId),
        invites: mockDb.invites.filter(i => i.workspace_id === wsId)
      };
    },
    invite: async (wsId: string, email: string, role: string) => {
      await delay();
      const newInv = { id: `inv-${Date.now()}`, workspace_id: wsId, email, role, token: `tok-${Date.now()}`, created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 86400000).toISOString() };
      mockDb.invites = [...mockDb.invites, newInv];
      mockDb.activities = [
        { id: `act-${Date.now()}`, action: 'Invited team member', object_type: 'Member', object_id: '', actor: 'Demo User', metadata: `${email} as ${role}`, time: new Date().toISOString() },
        ...mockDb.activities
      ];
      triggerUpdate();
    },
    removeMember: async (id: string) => {
      await delay();
      mockDb.members = mockDb.members.filter(m => m.id !== id);
      triggerUpdate();
    }
  },
  activities: {
    list: async (wsId: string) => {
      await delay(200);
      return mockDb.activities;
    }
  },
  workspace: {
    updateAreas: async (areas: string[]) => {
      await delay(300);
      mockDb.productAreas = [...areas];
      triggerUpdate();
    },
    updateSegments: async (segments: string[]) => {
      await delay(300);
      mockDb.segments = [...segments];
      triggerUpdate();
    },
    getAreas: async () => {
      await delay(200);
      return [...mockDb.productAreas];
    },
    getSegments: async () => {
      await delay(200);
      return [...mockDb.segments];
    }
  }
};

export function useQuery<T>(fetcher: () => Promise<T>, deps: any[]) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const execute = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetcher();
      setData(res);
    } finally {
      setIsLoading(false);
    }
  }, deps);

  useEffect(() => {
    execute();
    window.addEventListener('data-updated', execute);
    return () => window.removeEventListener('data-updated', execute);
  }, [execute]);

  return { data, isLoading, refetch: execute };
}

export const useSignals = (wsId?: string, opts?: any) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId) return { rows: [], total: 0 };
    return api.signals.list(wsId, opts);
  }, [wsId, JSON.stringify(opts)]);
  return { data: data || { rows: [], total: 0 }, isLoading, refetch };
};

export const useSignal = (id?: string) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!id) return null;
    return api.signals.get(id);
  }, [id]);
  return { data, isLoading, refetch };
};

export const useAccounts = (wsId?: string, opts?: any) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId) return { rows: [], total: 0 };
    return api.accounts.list(wsId, opts);
  }, [wsId, JSON.stringify(opts)]);
  return { data: data || { rows: [], total: 0 }, isLoading, refetch };
};

export const useAccount = (id?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!id) return null;
    return api.accounts.get(id);
  }, [id]);
  return { data, isLoading };
};

export const useProblems = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return [];
    return api.problems.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading };
};

export const useProblem = (id?: string) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!id) return null;
    return api.problems.get(id);
  }, [id]);
  return { data, isLoading, refetch };
};

export const useOpportunities = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return [];
    return api.opportunities.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading };
};

export const useOpportunity = (id?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!id) return null;
    return api.opportunities.get(id);
  }, [id]);
  return { data, isLoading };
};

export const useDecisions = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return [];
    return api.decisions.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading };
};

export const useDecision = (id?: string) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!id) return null;
    return api.decisions.get(id);
  }, [id]);
  return { data, isLoading, refetch };
};

export const useArtifacts = (wsId?: string) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId) return [];
    return api.artifacts.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading, refetch };
};

export const useArtifact = (id?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!id) return null;
    return api.artifacts.get(id);
  }, [id]);
  return { data, isLoading };
};

export const useLaunches = (wsId?: string) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId) return [];
    return api.launches.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading, refetch };
};

export const useTeam = (wsId?: string) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId) return { members: [], invites: [] };
    return api.team.list(wsId);
  }, [wsId]);
  return { data: data || { members: [], invites: [] }, isLoading, refetch };
};

export const useActivities = (wsId?: string) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId) return [];
    return api.activities.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading, refetch };
};

export const useProductAreas = () => {
  const { data, isLoading, refetch } = useQuery(async () => {
    return api.workspace.getAreas();
  }, []);
  return { data: data || [], isLoading, refetch };
};

export const useSegments = () => {
  const { data, isLoading, refetch } = useQuery(async () => {
    return api.workspace.getSegments();
  }, []);
  return { data: data || [], isLoading, refetch };
};
