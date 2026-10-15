/** Textos de «Cómo va tu negocio» en las estadísticas del administrador. */
export const INSIGHTS_COPY = {
  title: 'Cómo va tu negocio',
  kpis: { collected: 'Cobrado', interest: 'Ganancia cobrada', lent: 'Prestado', contact: 'Clientes encontrados' },
  daily: {
    title: 'Cobro día a día',
    legendCollected: 'Cobrado',
    legendExpected: 'Lo que vencía',
    summary: (collected: string, expected: string) => `En el período cobraste ${collected} de ${expected} que vencían según el calendario.`,
  },
  income: { title: 'De lo cobrado, ¿cuánto es ganancia?', principal: 'Capital que regresa', interest: 'Interés (ganancia)', empty: 'Todavía no hay cobros en este período.' },
  methods: { title: 'Cómo te pagan', CASH: 'Efectivo', NEQUI: 'Nequi', TRANSFER: 'Transferencia', hint: 'Mucho efectivo significa más dinero que cuidar en la calle.' },
  lending: {
    title: 'Lo que prestaste',
    loans: (count: number) => (count === 1 ? '1 préstamo nuevo' : `${String(count)} préstamos nuevos`),
    ticket: (value: string) => `Promedio por préstamo: ${value}`,
    interest: (value: string) => `Interés pactado: ${value}`,
    empty: 'No diste préstamos nuevos en este período.',
  },
  visits: {
    title: 'Cómo van las visitas',
    PAID: 'Pagaron',
    RESCHEDULED: 'Reprogramaron',
    REFUSED: 'Se negaron',
    NOT_FOUND: 'No estaba',
    summary: (visits: number, contact: string, paid: string) => `${String(visits)} visitas · encontraron al cliente en ${contact} y terminaron en pago en ${paid}.`,
    empty: 'No se registraron visitas en este período.',
  },
  settlements: {
    title: 'Cuadres de los cobradores',
    submitted: (count: number) => (count === 1 ? '1 cuadre enviado' : `${String(count)} cuadres enviados`),
    balanced: (count: number) => `${String(count)} cuadraron exacto`,
    difference: (count: number, short: string, surplus: string) => `${String(count)} con diferencia: faltaron ${short} y sobraron ${surplus}`,
    empty: 'No se enviaron cuadres en este período.',
  },
  forecast: { title: 'Lo que vence en los próximos 7 días', total: (value: string) => `Total esperado: ${value}` },
} as const;
