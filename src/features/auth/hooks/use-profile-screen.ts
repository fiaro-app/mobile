import { initials, firstName } from '@/features/auth/lib/names';
import { completeSignOut } from '@/features/auth/store/session-actions';
import { useSessionStore } from '@/features/auth/store/session-store';
import { canAdminister } from '@/features/workspace/lib/roles';
import { useWorkspaceStore } from '@/features/workspace/store/workspace-store';

function emailStatusOf(email: string | null | undefined, verified: boolean | undefined): string {
  if (!email) return 'Sin correo';
  return verified === true ? 'Verificado' : 'Sin verificar';
}

function switchLabelOf(mode: 'admin' | 'collector'): string {
  return mode === 'admin' ? 'Cambiar a modo Cobrador' : 'Cambiar a modo Administrador';
}

/** Lo que la pantalla de perfil dibuja y puede hacer. */
export interface ProfileScreen {
  readonly fullName: string;
  readonly firstName: string;
  readonly initials: string;
  readonly phone: string;
  /** Estado del correo de contacto para mostrarlo junto a la fila: verificado, sin verificar o sin correo. */
  readonly emailStatus: string;
  readonly signOut: () => void;
  /** Modo con el que se usa la app ahora. */
  readonly mode: 'admin' | 'collector';
  /** Texto del botón para cambiar de modo, o `null` si la persona solo tiene un rol. */
  readonly switchLabel: string | null;
  readonly switchMode: () => void;
}

/**
 * Datos de la persona con sesión y la acción de cerrarla.
 */
export function useProfileScreen(): ProfileScreen {
  const user = useSessionStore((state) => state.user);
  const fullName = user?.fullName ?? '';
  const roles = useWorkspaceStore((state) => state.roles);
  const mode = useWorkspaceStore((state) => state.mode);
  const setMode = useWorkspaceStore((state) => state.setMode);
  const both = canAdminister(roles) && roles.includes('COLLECTOR');
  return {
    fullName,
    firstName: firstName(fullName),
    initials: initials(fullName),
    phone: user?.phone ?? '',
    emailStatus: emailStatusOf(user?.contactEmail, user?.contactEmailVerified),
    mode,
    switchLabel: both ? switchLabelOf(mode) : null,
    switchMode: () => {
      setMode(mode === 'admin' ? 'collector' : 'admin');
    },
    signOut: () => {
      void completeSignOut();
    },
  };
}
