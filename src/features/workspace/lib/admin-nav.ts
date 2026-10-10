/** Secciones del menú del administrador, en orden. `href` es la ruta de Expo Router. */
export const ADMIN_NAV = [
  { key: 'summary', label: 'Resumen', href: '/admin' },
  { key: 'collectors', label: 'Cobradores', href: '/admin/collectors' },
  { key: 'clients', label: 'Clientes', href: '/admin/clients' },
  { key: 'loans', label: 'Préstamos', href: '/admin/loans' },
] as const;

export type AdminNavKey = (typeof ADMIN_NAV)[number]['key'];
