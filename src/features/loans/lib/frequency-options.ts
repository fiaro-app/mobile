import type { Frequency } from '@/features/loans/lib/loan-schemas';

/** Opciones de "cada cuánto se cobra", con su descripción. */
export const FREQUENCY_OPTIONS: readonly { value: Frequency; label: string; description: string }[] = [
  { value: 'DAILY', label: 'Diaria', description: 'Cada día de cobro' },
  { value: 'WEEKLY', label: 'Semanal', description: 'Cada 7 días' },
  { value: 'BIWEEKLY', label: 'Quincenal', description: 'Cada 15 días' },
  { value: 'MONTHLY', label: 'Mensual', description: 'Una vez al mes' },
];
