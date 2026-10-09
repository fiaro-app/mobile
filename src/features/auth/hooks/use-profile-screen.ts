import { initials, firstName } from '@/features/auth/lib/names';
import { completeSignOut } from '@/features/auth/store/session-actions';
import { useSessionStore } from '@/features/auth/store/session-store';

/** Lo que la pantalla de perfil dibuja y puede hacer. */
export interface ProfileScreen {
  readonly fullName: string;
  readonly firstName: string;
  readonly initials: string;
  readonly phone: string;
  readonly signOut: () => void;
}

/**
 * Datos de la persona con sesión y la acción de cerrarla. Hoy es lo único del perfil; el cierre de
 * ruta y las estadísticas del diseño "Perfil / Cierre de ruta" llegan con sus pantallas.
 */
export function useProfileScreen(): ProfileScreen {
  const user = useSessionStore((state) => state.user);
  const fullName = user?.fullName ?? '';
  return {
    fullName,
    firstName: firstName(fullName),
    initials: initials(fullName),
    phone: user?.phone ?? '',
    signOut: () => {
      void completeSignOut();
    },
  };
}
