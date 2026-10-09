/** Textos de "Ruta de hoy" y "Mis clientes", aparte de la interfaz para revisarlos o traducirlos. */
export const ROUTE_COPY = {
  routeTitle: 'Ruta de hoy',
  clientsTitle: 'Mis clientes',
  searchPlaceholder: 'Buscar cliente...',
  rangeTitle: 'Rango de mora',
  statusOptions: [
    { value: 'all', label: 'Todos' },
    { value: 'on-time', label: 'Al día' },
    { value: 'late', label: 'Atraso' },
    { value: 'overdue', label: 'Mora' },
  ],
  rangeOptions: [
    { value: 'any', label: 'Cualquier rango' },
    { value: '0-7', label: '0 a 7 días' },
    { value: '8-15', label: '8 a 15 días' },
    { value: '16-30', label: '16 a 30 días' },
    { value: '30+', label: 'Más de 30 días' },
  ],
} as const;
