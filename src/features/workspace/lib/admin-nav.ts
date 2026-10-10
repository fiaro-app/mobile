/** Secciones del menú del administrador, en orden. `href` es la ruta de Expo Router. */
export const ADMIN_NAV = [
  { key: 'summary', label: 'Resumen', href: '/admin' },
  { key: 'collectors', label: 'Cobradores', href: '/admin/collectors' },
] as const;

export type AdminNavKey = (typeof ADMIN_NAV)[number]['key'];
