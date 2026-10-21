/** Secciones del menú del administrador, en orden. `href` es la ruta de Expo Router. */
export const ADMIN_NAV = [
  { key: 'summary', label: 'Resumen', href: '/admin' },
  { key: 'collectors', label: 'Cobradores', href: '/admin/collectors' },
  { key: 'clients', label: 'Clientes', href: '/admin/clients' },
  { key: 'loans', label: 'Préstamos', href: '/admin/loans' },
  { key: 'requests', label: 'Solicitudes', href: '/admin/requests' },
  { key: 'settlements', label: 'Cuadres', href: '/admin/settlements' },
  { key: 'payments', label: 'Cobros del día', href: '/admin/payments' },
  { key: 'routes', label: 'Rutas', href: '/admin/routes' },
  { key: 'stats', label: 'Estadísticas', href: '/admin/stats' },
  { key: 'admins', label: 'Administradores', href: '/admin/admins' },
  { key: 'plan', label: 'Plan y pagos', href: '/admin/plan' },
  { key: 'settings', label: 'Configuración', href: '/admin/settings' },
] as const;

export type AdminNavKey = (typeof ADMIN_NAV)[number]['key'];
