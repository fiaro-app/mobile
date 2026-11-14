import { z } from 'zod';

/** Cuántas filas admite la API por petición (D-152 de la API). */
export const IMPORT_CHUNK_SIZE = 200;

export const IMPORT_FREQUENCIES = ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'] as const;
export type ImportFrequency = (typeof IMPORT_FREQUENCIES)[number];

/** Una fila de la hoja tal como la recibe `POST /imports`: un cliente y, si lo tiene, su préstamo en curso. */
export interface ImportRow {
  readonly nationalId: string;
  readonly fullName: string;
  readonly occupation: string;
  readonly phone: string;
  readonly address: string;
  readonly loan: {
    readonly remainingInstallments: number;
    readonly installmentValue: number;
    readonly frequency: ImportFrequency;
    readonly nextInstallmentDate: string;
    readonly pendingCapital?: number;
    readonly collectorPhone?: string;
  } | null;
}

export const IMPORT_ROW_STATUSES = ['READY', 'INVALID', 'IMPORTED', 'FAILED'] as const;
export type ImportRowStatus = (typeof IMPORT_ROW_STATUSES)[number];

/** La respuesta de `POST /imports`: un resultado por fila, con el número de fila dentro de la tanda (desde 1). */
export const ImportResponseSchema = z.object({
  rows: z.array(
    z.object({
      row: z.int(),
      status: z.enum(IMPORT_ROW_STATUSES),
      issues: z.array(z.object({ message: z.string() })),
    }),
  ),
});
export type ImportResponse = z.infer<typeof ImportResponseSchema>;
