/** Textos de "Ruta de hoy" y "Mis clientes", aparte de la interfaz para revisarlos o traducirlos. */
export const ROUTE_COPY = {
  routeTitle: 'Ruta de hoy',
  clientsTitle: 'Mis clientes',
  searchPlaceholder: 'Buscar cliente...',
  rangeTitle: 'Rango de mora',
  statusOptions: [
    { value: 'all', label: 'Todos' },
    { value: 'current', label: 'Al día' },
    { value: 'late', label: 'Atraso' },
    { value: 'delinquent', label: 'Mora' },
  ],
  rangeOptions: [
    { value: 'any', label: 'Cualquier rango' },
    { value: '0-7', label: '0 a 7 días' },
    { value: '8-15', label: '8 a 15 días' },
    { value: '16-30', label: '16 a 30 días' },
    { value: '30+', label: 'Más de 30 días' },
  ],
  /** Pastillas de «Ruta de hoy»; el número entre paréntesis lo pone la pantalla. */
  routeFilters: [
    { value: 'all', label: 'Todos' },
    { value: 'pending', label: 'Por cobrar' },
    { value: 'delinquent', label: 'Mora' },
    { value: 'late', label: 'Atraso' },
    { value: 'current', label: 'Al día' },
    { value: 'collected', label: 'Cobrados' },
  ],
  sortTitle: 'Ordenar la ruta',
  sortOptions: [
    { value: 'urgent', label: 'Más urgente', description: 'Mora y deuda juntas (el orden de Fiaro)' },
    { value: 'balance', label: 'Mayor deuda', description: 'Quien más te debe primero' },
    { value: 'days', label: 'Más días de mora', description: 'Quien lleva más tiempo sin pagar primero' },
    { value: 'name', label: 'Nombre (A–Z)' },
  ],
} as const;
