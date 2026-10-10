import type { Assignment } from '@/features/loans/lib/loan-schemas';

/**
 * Cuántas cuotas completas lleva pagadas un préstamo: lo pagado (total a pagar − saldo) entre el valor de la cuota,
 * sin pasarse del número de cuotas. Es una aproximación para mostrar progreso; el estado real de cada cuota lo da el calendario.
 */
export function paidInstallments(totalPayable: number, balance: number, installmentValue: number, installmentCount: number): number {
  if (installmentValue <= 0) return 0;
  const paid = Math.max(0, totalPayable - balance);
  return Math.min(installmentCount, Math.floor(paid / installmentValue));
}

/** Porcentaje pagado del total (0–100, entero). */
export function paidPercent(totalPayable: number, balance: number): number {
  if (totalPayable <= 0) return 0;
  const paid = Math.min(totalPayable, Math.max(0, totalPayable - balance));
  return Math.round((paid / totalPayable) * 100);
}

/**
 * La asignación que rige hoy: vigente desde antes o desde hoy y sin fecha de fin (o con fin futuro). Si hay varias, gana la
 * abierta (sin fin) y, entre iguales, la que empezó más tarde.
 */
export function currentAssignment(assignments: readonly Assignment[], today: string): Assignment | null {
  const active = assignments.filter((assignment) => assignment.effectiveFrom <= today && (assignment.effectiveTo === null || assignment.effectiveTo >= today));
  const rank = (assignment: Assignment) => (assignment.effectiveTo === null ? 0 : 1);
  return active.toSorted((a, b) => rank(a) - rank(b) || b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ?? null;
}
