import { create } from 'zustand';

interface SyncState {
  readonly pending: number;
  readonly rejected: number;
  readonly setCounts: (pending: number, rejected: number) => void;
}

/**
 * Cuántas visitas de la persona actual esperan enviarse (`pending`) y cuántas el API rechazó (`rejected`).
 * Es estado de cliente derivado de la cola guardada; alimenta el aviso "N visitas pendientes de
 * sincronizar" de la ruta. Lo actualiza `refreshSyncCounts` después de cada cambio en la cola.
 */
export const useSyncStore = create<SyncState>()((set) => ({
  pending: 0,
  rejected: 0,
  setCounts: (pending, rejected) => {
    set({ pending, rejected });
  },
}));
