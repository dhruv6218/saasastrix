import { useState, useEffect, useCallback } from 'react';
import { get, post, patch, del } from './apiClient';

export const triggerUpdate = () => window.dispatchEvent(new Event('data-updated'));

function getActiveWsId(): string {
  return localStorage.getItem('astrix_active_ws') || '';
}

function resolve3(a: string, b: any, c?: any): [string, string, any] {
  if (c !== undefined) return [a, b, c];
  return [getActiveWsId(), a, b];
}

function resolveCreate(a: string | any, b?: any): [string, any] {
  if (b !== undefined) return [a as string, b];
  const wsId = (typeof a === 'object' && a?.workspace_id) ? a.workspace_id : getActiveWsId();
  return [wsId, a];
}

function resolve2(a: string, b?: string): [string, string] {
  if (b !== undefined) return [a, b];
  return [getActiveWsId(), a];
}

export const api = {
  signals: {
    list: (wsId: string, opts?: any) => get(`/workspaces/${wsId}/signals`, {
      search: opts?.globalFilter,
      severity: opts?.severity,
      sentiment: opts?.sentiment,
      product_area: opts?.product_area,
      account_id: opts?.account_id,
      date_from: opts?.date_from,
      date_to: opts?.date_to,
      page: opts?.page,
      limit: opts?.limit,
      sort_by: opts?.sorting?.[0]?.id,
      sort_dir: opts?.sorting?.[0]?.desc ? 'desc' : 'asc',
    }),
    create: (a: string | any, b?: any) => {
      const [wsId, data] = resolveCreate(a, b);
      return post(`/workspaces/${wsId}/signals`, data);
    },
    get: (wsId: string, id: string) => get(`/workspaces/${wsId}/signals/${id}`),
    update: (a: string, b: any, c?: any) => {
      const [wsId, id, data] = resolve3(a, b, c);
      return patch(`/workspaces/${wsId}/signals/${id}`, data);
    },
    csvImport: (wsId: string, rows: any[]) => post(`/workspaces/${wsId}/signals/csv-import`, { rows }),
  },

  accounts: {
    list: (wsId: string, opts?: any) => get(`/workspaces/${wsId}/accounts`, {
      search: opts?.globalFilter,
      plan: opts?.plan,
      arr_min: opts?.arr_min,
      arr_max: opts?.arr_max,
      health: opts?.health,
      page: opts?.page,
      limit: opts?.limit,
      sort_by: opts?.sorting?.[0]?.id,
      sort_dir: opts?.sorting?.[0]?.desc ? 'desc' : 'asc',
    }),
    create: (a: string | any, b?: any) => {
      const [wsId, data] = resolveCreate(a, b);
      return post(`/workspaces/${wsId}/accounts`, data);
    },
    get: (wsId: string, id: string) => get(`/workspaces/${wsId}/accounts/${id}`),
    update: (a: string, b: any, c?: any) => {
      const [wsId, id, data] = resolve3(a, b, c);
      return patch(`/workspaces/${wsId}/accounts/${id}`, data);
    },
  },

  problems: {
    list: (wsId: string, opts?: any) => get(`/workspaces/${wsId}/problems`, opts),
    get: (wsId: string, id: string) => get(`/workspaces/${wsId}/problems/${id}`),
    create: (a: string | any, b?: any) => {
      const [wsId, data] = resolveCreate(a, b);
      return post(`/workspaces/${wsId}/problems`, data);
    },
    update: (a: string, b: any, c?: any) => {
      const [wsId, id, data] = resolve3(a, b, c);
      return patch(`/workspaces/${wsId}/problems/${id}`, data);
    },
    linkSignal: (a: string, b: string, c?: string) => {
      const [wsId, problemId] = resolve2(a, c !== undefined ? b : undefined);
      const signalId = c !== undefined ? c : b;
      return post(`/workspaces/${wsId}/problems/${problemId}/signals/${signalId}`);
    },
    unlinkSignal: (a: string, b: string, c?: string) => {
      const [wsId, problemId] = resolve2(a, c !== undefined ? b : undefined);
      const signalId = c !== undefined ? c : b;
      return del(`/workspaces/${wsId}/problems/${problemId}/signals/${signalId}`);
    },
  },

  opportunities: {
    list: (wsId: string, opts?: any) => get(`/workspaces/${wsId}/opportunities`, opts),
    get: (wsId: string, id: string) => get(`/workspaces/${wsId}/opportunities/${id}`),
    create: (a: string | any, b?: any) => {
      const [wsId, data] = resolveCreate(a, b);
      return post(`/workspaces/${wsId}/opportunities`, data);
    },
  },

  decisions: {
    list: (wsId: string, opts?: any) => get(`/workspaces/${wsId}/decisions`, opts),
    get: (wsId: string, id: string) => get(`/workspaces/${wsId}/decisions/${id}`),
    create: (a: string | any, b?: any) => {
      const [wsId, data] = resolveCreate(a, b);
      return post(`/workspaces/${wsId}/decisions`, data);
    },
    update: (a: string, b: any, c?: any) => {
      const [wsId, id, data] = resolve3(a, b, c);
      return patch(`/workspaces/${wsId}/decisions/${id}`, data);
    },
  },

  artifacts: {
    list: (wsId: string) => get(`/workspaces/${wsId}/artifacts`),
    get: (wsId: string, id: string) => get(`/workspaces/${wsId}/artifacts/${id}`),
    create: (a: string | any, b?: any) => {
      const [wsId, data] = resolveCreate(a, b);
      return post(`/workspaces/${wsId}/artifacts`, data);
    },
    update: (a: string, b: any, c?: any) => {
      const [wsId, id, data] = resolve3(a, b, c);
      return patch(`/workspaces/${wsId}/artifacts/${id}`, data);
    },
  },

  launches: {
    list: (wsId: string) => get(`/workspaces/${wsId}/launches`),
    get: (wsId: string, id: string) => get(`/workspaces/${wsId}/launches/${id}`),
    create: (a: string | any, b?: any) => {
      const [wsId, data] = resolveCreate(a, b);
      return post(`/workspaces/${wsId}/launches`, data);
    },
    update: (a: string, b: any, c?: any) => {
      const [wsId, id, data] = resolve3(a, b, c);
      return patch(`/workspaces/${wsId}/launches/${id}`, data);
    },
  },

  team: {
    list: (wsId: string) => get(`/workspaces/${wsId}/team`),
    invite: (wsId: string, email: string, role: string) =>
      post(`/workspaces/${wsId}/team/invite`, { email, role }),
    removeMember: (a: string, b?: string) => {
      if (b !== undefined) return del(`/workspaces/${a}/team/${b}`);
      return del(`/workspaces/${getActiveWsId()}/team/${a}`);
    },
    updateRole: (a: string, b: any, c?: any) => {
      const [wsId, id, data] = resolve3(a, b, c);
      return patch(`/workspaces/${wsId}/team/${id}`, data);
    },
  },

  activities: {
    list: (wsId: string, opts?: any) => get(`/workspaces/${wsId}/activities`, opts),
  },

  workspace: {
    updateAreas: (wsId: string, areas: string[]) =>
      patch(`/workspaces/${wsId}`, { product_areas: areas }),
    updateSegments: (wsId: string, segments: string[]) =>
      patch(`/workspaces/${wsId}`, { segments }),
  },

  billing: {
    checkout: (wsId: string, plan: string, billing_period: string) =>
      post(`/billing/${wsId}/checkout`, { plan, billing_period }),
    status: (wsId: string) => get(`/billing/${wsId}/status`),
  },

  ai: {
    generateArtifact: (wsId: string, decision_id: string, artifact_type: string) =>
      post(`/workspaces/${wsId}/ai/generate-artifact`, { decision_id, artifact_type }),
    suggestClassification: (wsId: string, raw_text: string) =>
      post(`/workspaces/${wsId}/ai/suggest-classification`, { raw_text }),
  },
};

// ─── React hooks ─────────────────────────────────────────────────────────────

export function useQuery<T>(fetcher: () => Promise<T>, deps: any[]) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetcher();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    execute();
    window.addEventListener('data-updated', execute);
    return () => window.removeEventListener('data-updated', execute);
  }, [execute]);

  return { data, isLoading, error, refetch: execute };
}

export const useSignals = (wsId?: string, opts?: any) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId) return { rows: [], total: 0 };
    return api.signals.list(wsId, opts);
  }, [wsId, JSON.stringify(opts)]);
  return { data: data || { rows: [], total: 0 }, isLoading, refetch };
};

export const useSignal = (wsId?: string, id?: string) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId || !id) return null;
    return api.signals.get(wsId, id);
  }, [wsId, id]);
  return { data, isLoading, refetch };
};

export const useAccounts = (wsId?: string, opts?: any) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId) return { rows: [], total: 0 };
    return api.accounts.list(wsId, opts);
  }, [wsId, JSON.stringify(opts)]);
  return { data: data || { rows: [], total: 0 }, isLoading, refetch };
};

export const useAccount = (wsId?: string, id?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId || !id) return null;
    return api.accounts.get(wsId, id);
  }, [wsId, id]);
  return { data, isLoading };
};

export const useProblems = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return [];
    return api.problems.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading };
};

export const useProblem = (wsId?: string, id?: string) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId || !id) return null;
    return api.problems.get(wsId, id);
  }, [wsId, id]);
  return { data, isLoading, refetch };
};

export const useOpportunities = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return [];
    return api.opportunities.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading };
};

export const useOpportunity = (wsId?: string, id?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId || !id) return null;
    return api.opportunities.get(wsId, id);
  }, [wsId, id]);
  return { data, isLoading };
};

export const useDecisions = (wsId?: string, opts?: any) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return [];
    const res = await api.decisions.list(wsId, opts) as any;
    return Array.isArray(res) ? res : (res?.rows || []);
  }, [wsId, JSON.stringify(opts)]);
  return { data: data || [], isLoading };
};

export const useDecision = (wsId?: string, id?: string) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId || !id) return null;
    return api.decisions.get(wsId, id);
  }, [wsId, id]);
  return { data, isLoading, refetch };
};

export const useArtifacts = (wsId?: string) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId) return [];
    return api.artifacts.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading, refetch };
};

export const useArtifact = (wsId?: string, id?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId || !id) return null;
    return api.artifacts.get(wsId, id);
  }, [wsId, id]);
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

export const useProductAreas = (wsId?: string) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId) return [];
    const ws = await get<any>(`/workspaces/${wsId}`);
    return ws?.product_areas || [];
  }, [wsId]);
  return { data: data || [], isLoading, refetch };
};

export const useSegments = (wsId?: string) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId) return [];
    const ws = await get<any>(`/workspaces/${wsId}`);
    return ws?.segments || [];
  }, [wsId]);
  return { data: data || [], isLoading, refetch };
};
