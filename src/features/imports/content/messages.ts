/** Textos de «Importar desde Excel» (D-152 de la API; los mismos de la web, W-107). */
export const IMPORTS_COPY = {
  title: 'Importar desde Excel',
  upgrade: {
    title: 'Importar desde Excel está en el plan Pro',
    message: 'Con Pro y Team subes de una vez a tus clientes y sus préstamos en curso desde una hoja de Excel o CSV, en lugar de escribirlos uno por uno.',
    action: 'Ver planes',
  },
  intro: {
    description:
      'Sube a tus clientes y los préstamos que ya tienen en curso: lo que les falta por pagar, no el historial. Primero revisamos la hoja y te mostramos qué se importaría; solo se crea cuando confirmas.',
    steps: [
      '1. Descarga la plantilla y llénala (un cliente por fila; si tiene préstamo, llena las columnas de cuotas, valor, frecuencia y próxima cuota).',
      '2. Sube el archivo (.xlsx o .csv, hasta 2.000 filas).',
      '3. Revisa el resultado y confirma.',
    ],
    template: 'Compartir plantilla',
    templateFile: 'plantilla-importar-fiaro.csv',
    templateFailed: 'No pudimos compartir la plantilla en este dispositivo.',
    pick: 'Elegir archivo',
  },
  working: { reading: 'Leyendo la hoja…', reviewing: 'Revisando las filas…', importing: 'Importando…' },
  sheetErrors: {
    format: 'Ese archivo no es un .xlsx ni un .csv.',
    unreadable: 'No pudimos leer el archivo. Revisa que no esté dañado o protegido con contraseña.',
    empty: 'La hoja no tiene filas con datos debajo de los encabezados.',
    tooMany: 'La hoja tiene más de 2.000 filas. Divídela en varios archivos.',
    missing: (columns: readonly string[]) => `Faltan estas columnas en la primera fila: ${columns.join(', ')}.`,
    network: 'No pudimos hablar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
    forbidden: 'Tu plan o tu rol no permite importar.',
  },
  review: {
    title: 'Esto se importaría',
    ready: (count: number) => `${String(count)} filas listas`,
    invalid: (count: number) => `${String(count)} filas con errores (no se importan)`,
    confirm: (count: number) => `Importar ${String(count)} filas`,
    cancel: 'Elegir otro archivo',
    nothing: 'Ninguna fila está lista para importar. Corrige la hoja y súbela de nuevo.',
  },
  done: {
    title: 'Importación terminada',
    summary: (imported: number, failed: number) => (failed > 0 ? `Se importaron ${String(imported)} filas y ${String(failed)} fallaron.` : `Se importaron ${String(imported)} filas.`),
    again: 'Importar otra hoja',
    goToClients: 'Ver clientes',
  },
  problems: { title: 'Filas con problemas', row: (sheetRow: number) => `Fila ${String(sheetRow)}` },
} as const;
