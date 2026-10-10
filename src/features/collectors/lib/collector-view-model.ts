import { initials } from '@/features/auth/lib/names';
import type { Portfolio } from '@/features/collectors/lib/collector-schemas';
import type { Member } from '@/features/team/lib/member-schemas';
import { formatPhoneInput } from '@/features/auth/lib/phone';

/** Filtro por estado del listado. */
export type CollectorStatusFilter = 'all' | 'active' | 'inactive';

/** Una fila del listado de cobradores. */
export interface CollectorRowModel {
  readonly id: string;
  readonly initials: string;
  readonly name: string;
  readonly phone: string;
  readonly portfolio: string;
  readonly active: boolean;
}

/** `+573001234567` → `300 123 4567`; si no tiene la forma de un celular colombiano, se deja tal cual. */
export function displayPhone(phone: string): string {
  return phone.startsWith('+57') ? formatPhoneInput(phone.slice(3)) : phone;
}

/** Nombre de la cartera de un colaborador ("Sin cartera" si no tiene o ya no existe). */
export function portfolioName(portfolios: readonly Portfolio[], portfolioId: string | null): string {
  return portfolios.find((portfolio) => portfolio.id === portfolioId)?.name ?? 'Sin cartera';
}

/** Solo los cobradores (quien además administra aparece también si tiene el rol). */
export function collectorsOf(members: readonly Member[]): Member[] {
  return members.filter((member) => member.roles.includes('COLLECTOR'));
}

/** Normaliza para buscar sin importar mayúsculas ni tildes. */
export function fold(text: string): string {
  return text.normalize('NFD').replaceAll(/\p{Diacritic}/gu, '').toLowerCase();
}

/**
 * Cobradores a mostrar: filtra por estado y por la búsqueda (nombre o celular, sin tildes ni mayúsculas) y los
 * ordena activos primero y por nombre dentro de cada grupo.
 */
export function toCollectorRows(members: readonly Member[], portfolios: readonly Portfolio[], status: CollectorStatusFilter, search: string): CollectorRowModel[] {
  const needle = fold(search.trim());
  return collectorsOf(members)
    .filter((member) => (status === 'all' ? true : (member.status === 'ACTIVE') === (status === 'active')))
    .filter((member) => needle === '' || fold(member.fullName).includes(needle) || member.phone.replaceAll(/\D/g, '').includes(needle.replaceAll(/\D/g, '') || '\u0000'))
    .toSorted((a, b) => (a.status === b.status ? a.fullName.localeCompare(b.fullName, 'es') : a.status === 'ACTIVE' ? -1 : 1))
    .map((member) => ({
      id: member.id,
      initials: initials(member.fullName),
      name: member.fullName,
      phone: displayPhone(member.phone),
      portfolio: portfolioName(portfolios, member.portfolioId),
      active: member.status === 'ACTIVE',
    }));
}
