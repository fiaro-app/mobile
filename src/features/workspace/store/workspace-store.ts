import { create } from 'zustand';
import { defaultMode, type Mode, type Role } from '@/features/workspace/lib/roles';

interface WorkspaceState {
  /** `idle` sin sesión, `loading` averiguando los roles, `ready` con roles y modo definidos. */
  readonly status: 'idle' | 'loading' | 'ready';
  readonly roles: readonly Role[];
  readonly mode: Mode;
}

interface WorkspaceActions {
  readonly loading: () => void;
  readonly loaded: (roles: readonly Role[]) => void;
  readonly setMode: (mode: Mode) => void;
  readonly reset: () => void;
}

const INITIAL: WorkspaceState = { status: 'idle', roles: [], mode: 'collector' };

/**
 * Con qué roles y en qué modo se usa la app (administrador o cobrador). Es estado del cliente, no del
 * servidor: el modo lo elige la persona al cambiar desde el menú y se reinicia al cerrar sesión.
 */
export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>()((set) => ({
  ...INITIAL,
  loading: () => {
    set({ status: 'loading' });
  },
  loaded: (roles) => {
    set({ status: 'ready', roles, mode: defaultMode(roles) });
  },
  setMode: (mode) => {
    set({ mode });
  },
  reset: () => {
    set(INITIAL);
  },
}));
