import type { ApiFailure } from '@/lib/http/failure';

/**
 * Texto de un `PLAN_LIMIT_REACHED`. El API comparte ese código entre cuatro topes y los distingue
 * con `errorCode`: cobradores (`M003A`), administradores (`M007A`), préstamos activos (`L004A`) y
 * carteras (`B007A`). `fallback` es el tope que ese flujo siempre puede alcanzar cuando el API
 * todavía no manda `errorCode`; un código que no conoce (un tope nuevo) cae al mensaje general.
 */
export function planLimitMessage(failure: ApiFailure, fallback: 'M003A' | 'M007A' | 'L004A' | 'B007A'): string {
  const errorCode = failure.kind === 'http' ? (failure.errorCode ?? fallback) : fallback;
  switch (errorCode) {
    case 'M003A':
      return 'Tu plan ya no tiene cupos de cobrador. Da de baja a uno o mejora tu plan.';
    case 'M007A':
      return 'Tu plan ya no tiene cupos de administrador (tú cuentas como uno). Desactiva a otro o mejora tu plan.';
    case 'L004A':
      return 'Tu plan llegó al máximo de préstamos activos. Espera a que se cierre alguno o mejora tu plan. Cobrar los que ya tienes no se bloquea.';
    case 'B007A':
      return 'Tu negocio ya tiene el máximo de carteras de tu plan. Borra una que no uses o mejora tu plan.';
    default:
      return 'Tu plan llegó a uno de sus límites. Libera un cupo o mejora tu plan.';
  }
}
