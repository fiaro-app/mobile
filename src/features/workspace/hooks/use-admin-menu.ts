import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import type { AdminDrawerProps } from '@/components/organisms/AdminDrawer';
import { initials } from '@/features/auth/lib/names';
import { completeSignOut } from '@/features/auth/store/session-actions';
import { useSessionStore } from '@/features/auth/store/session-store';
import { useLender } from '@/features/workspace/hooks/use-lender';
import { ADMIN_NAV, type AdminNavKey } from '@/features/workspace/lib/admin-nav';
import { canCollect, roleLabel } from '@/features/workspace/lib/roles';
import { useWorkspaceStore } from '@/features/workspace/store/workspace-store';

/** Todo lo que `AdminTemplate` necesita para su barra y su menú lateral. */
export interface AdminMenu {
  readonly initials: string;
  readonly drawer: AdminDrawerProps;
  readonly open: () => void;
  readonly goToAccount: () => void;
}

/**
 * Lógica del menú del administrador. Las secciones se abren con `replace` (no `push`): son destinos del mismo nivel,
 * y apilarlas haría que "atrás" recorriera todas las secciones visitadas en vez de salir de la app. "Cambiar a modo
 * cobrador" solo aparece si la persona también tiene el rol de cobrador.
 *
 * @param active - Sección en la que está la pantalla, para resaltarla.
 */
export function useAdminMenu(active: AdminNavKey): AdminMenu {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const user = useSessionStore((state) => state.user);
  const roles = useWorkspaceStore((state) => state.roles);
  const setMode = useWorkspaceStore((state) => state.setMode);
  const lender = useLender();
  const close = () => {
    setVisible(false);
  };
  const go = (href: Href, mode: 'push' | 'replace') => () => {
    close();
    if (mode === 'replace') router.replace(href);
    else router.push(href);
  };
  const fullName = user?.fullName ?? '';
  return {
    initials: initials(fullName),
    open: () => {
      setVisible(true);
    },
    goToAccount: () => {
      router.push('/profile');
    },
    drawer: {
      visible,
      businessName: lender.data?.name ?? 'Mi financiera',
      subtitle: 'Panel administrativo',
      userName: fullName,
      userRole: roleLabel(roles),
      initials: initials(fullName),
      items: ADMIN_NAV.map((item) => ({ key: item.key, label: item.label, active: item.key === active, onPress: go(item.href, 'replace') })),
      footerItems: [
        ...(canCollect(roles)
          ? [
              {
                key: 'collector-mode',
                label: 'Cambiar a modo Cobrador',
                tone: 'primary' as const,
                onPress: () => {
                  close();
                  setMode('collector');
                },
              },
            ]
          : []),
        { key: 'notifications', label: 'Notificaciones', onPress: go('/notifications', 'push') },
        { key: 'account', label: 'Mi cuenta', onPress: go('/profile', 'push') },
        {
          key: 'sign-out',
          label: 'Cerrar sesión',
          tone: 'destructive' as const,
          onPress: () => {
            close();
            void completeSignOut();
          },
        },
      ],
      onClose: close,
    },
  };
}
