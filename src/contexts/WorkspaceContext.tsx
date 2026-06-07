import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { get, patch } from '../lib/apiClient';
import { Workspace } from '../types';

interface WorkspaceWithRole extends Workspace {
  role?: string;
}

interface WorkspaceContextType {
  activeWorkspace: WorkspaceWithRole | null;
  workspaces: WorkspaceWithRole[];
  isWorkspaceInitializing: boolean;
  setActiveWorkspace: (ws: WorkspaceWithRole) => void;
  refreshWorkspaces: () => Promise<void>;
  updateWorkspace: (data: Partial<Workspace>) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  activeWorkspace: null,
  workspaces: [],
  isWorkspaceInitializing: true,
  setActiveWorkspace: () => {},
  refreshWorkspaces: async () => {},
  updateWorkspace: async () => {},
});

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<WorkspaceWithRole | null>(null);
  const [isWorkspaceInitializing, setIsWorkspaceInitializing] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    if (!user) {
      setWorkspaces([]);
      setActiveWorkspaceState(null);
      setIsWorkspaceInitializing(false);
      return;
    }
    setIsWorkspaceInitializing(true);
    try {
      const data = await get<WorkspaceWithRole[]>('/workspaces');
      setWorkspaces(data);
      if (data.length > 0) {
        const savedId = localStorage.getItem('astrix_active_ws');
        const saved = savedId ? data.find(w => w.id === savedId) : null;
        setActiveWorkspaceState(saved || data[0]);
      } else {
        setActiveWorkspaceState(null);
      }
    } catch {
      setWorkspaces([]);
      setActiveWorkspaceState(null);
    } finally {
      setIsWorkspaceInitializing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleSetActiveWorkspace = (ws: WorkspaceWithRole) => {
    setActiveWorkspaceState(ws);
    localStorage.setItem('astrix_active_ws', ws.id);
  };

  const updateWorkspace = async (data: Partial<Workspace>) => {
    if (!activeWorkspace) return;
    const updated = await patch<WorkspaceWithRole>(`/workspaces/${activeWorkspace.id}`, data);
    setActiveWorkspaceState(prev => prev ? { ...prev, ...updated } : updated);
    setWorkspaces(prev => prev.map(w => w.id === activeWorkspace.id ? { ...w, ...updated } : w));
  };

  return (
    <WorkspaceContext.Provider value={{
      activeWorkspace,
      workspaces,
      isWorkspaceInitializing,
      setActiveWorkspace: handleSetActiveWorkspace,
      refreshWorkspaces: fetchWorkspaces,
      updateWorkspace,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
