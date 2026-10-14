import { create } from 'zustand';
import { resolveAccess, type AccessState } from '@/features/auth/lib/access';
import type { SessionUser } from '@/features/auth/lib/session-user';

interface SessionState {
  readonly ready: boolean;
  readonly user: SessionUser | null;
  readonly pinEnabled: boolean;
  readonly unlocked: boolean;
  readonly pinOfferPending: boolean;
}

interface SessionActions {
  /** Carga lo que había en el dispositivo al arrancar. Con PIN, la app arranca bloqueada. */
  readonly restore: (input: { user: SessionUser | null; pinEnabled: boolean; pinOfferPending: boolean }) => void;
  /** Sesión recién abierta con celular y contraseña: no hace falta desbloquear. */
  readonly signedIn: (input: { user: SessionUser; pinEnabled: boolean; pinOfferPending: boolean }) => void;
  /** El API devolvió la persona actualizada (por ejemplo, tras cambiar la contraseña temporal). */
  readonly userUpdated: (user: SessionUser) => void;
  readonly unlock: () => void;
  readonly lock: () => void;
  readonly pinCreated: () => void;
  readonly pinOfferDismissed: () => void;
  readonly signedOut: () => void;
}

/**
 * Estado de la sesión en el dispositivo. Es estado de CLIENTE (qué pantalla toca, si está
 * desbloqueada), por eso Zustand; los datos que vienen del API y se pueden volver a pedir
 * (como la versión mínima) viven en TanStack Query. Las pantallas no escriben aquí: lo hacen las
 * funciones de `session-actions.ts`, que además tocan el API y el almacén cifrado.
 */
export const useSessionStore = create<SessionState & SessionActions>()((set) => ({
  ready: false,
  user: null,
  pinEnabled: false,
  unlocked: false,
  pinOfferPending: false,
  restore: ({ user, pinEnabled, pinOfferPending }) => {
    set({ ready: true, user, pinEnabled, pinOfferPending, unlocked: !pinEnabled });
  },
  signedIn: ({ user, pinEnabled, pinOfferPending }) => {
    set({ ready: true, user, pinEnabled, pinOfferPending, unlocked: true });
  },
  userUpdated: (user) => {
    set({ user });
  },
  unlock: () => {
    set({ unlocked: true });
  },
  lock: () => {
    set((state) => (state.pinEnabled ? { unlocked: false } : state));
  },
  pinCreated: () => {
    set({ pinEnabled: true, pinOfferPending: false });
  },
  pinOfferDismissed: () => {
    set({ pinOfferPending: false });
  },
  signedOut: () => {
    set({ ready: true, user: null, pinEnabled: false, unlocked: false, pinOfferPending: false });
  },
}));

/** Estado de acceso derivado: lo que decide qué pantallas existen. */
export function useAccess(): AccessState {
  const { ready, user, pinEnabled, unlocked, pinOfferPending } = useSessionStore();
  return resolveAccess({ ready, user, pinEnabled, unlocked, pinOfferPending });
}
