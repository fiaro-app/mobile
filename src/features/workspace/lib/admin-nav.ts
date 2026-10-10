/** Secciones del menú del administrador, en orden. `href` es la ruta de Expo Router. */
export const ADMIN_NAV = [
  { key: 'summary', label: 'Resumen', href: '/admin' },
] as const;

export type AdminNavKey = (typeof ADMIN_NAV)[number]['key'];
