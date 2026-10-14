import type { LoanListItem, LoanStatus } from '@/features/loans/lib/loan-schemas';
import { fold } from '@/features/collectors/lib/collector-view-model';
import { classifyEntry } from '@/lib/loan-status';

/** Filtros de la lista de préstamos. `arrears` es local (el API no filtra por mora); los demás los resuelve el API por estado. */
export type LoanFilter = 'all' | 'active' | 'arrears' | 'paid' | 'canceled';

/** Estado que se le pide al API para cada filtro (`undefined` = sin filtro, trae todos). */
export function apiStatusOf(filter: LoanFilter): LoanStatus | undefined {
  switch (filter) {
    case 'active':
    case 'arrears':
      return 'ACTIVE';
    case 'paid':
      return 'PAID_OFF';
    case 'canceled':
      return 'CANCELED';
    default:
      return undefined;
  }
}

/** `true` si el préstamo cumple el filtro local (solo `arrears` filtra aquí: vigente y con al menos un día de atraso). */
export function matchesLoanFilter(loan: LoanListItem, filter: LoanFilter): boolean {
  if (filter !== 'arrears') return true;
  return loan.status === 'ACTIVE' && classifyEntry(loan) !== 'current' && classifyEntry(loan) !== 'paid';
}

/** `true` si el nombre del cliente contiene el texto buscado (sin tildes ni mayúsculas). Con búsqueda vacía todo coincide. */
export function matchesSearch(clientName: string, search: string): boolean {
  const needle = fold(search.trim());
  return needle === '' || fold(clientName).includes(needle);
}
