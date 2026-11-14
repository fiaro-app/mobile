import { useMemo } from 'react';
import type { FilterOption } from '@/components/molecules/FilterBar';
import { useMembers } from '@/features/team/hooks/use-members';

/** Valor del selector que significa «todos los cobradores». */
export const ALL_COLLECTORS = '';

/** Opciones de un filtro por cobrador: «Todos los cobradores» y cada colaborador con rol de cobrador. */
export function useCollectorOptions(): readonly FilterOption<string>[] {
  const members = useMembers();
  return useMemo(
    () => [
      { value: ALL_COLLECTORS, label: 'Todos los cobradores' },
      ...(members.data ?? []).filter((member) => member.roles.includes('COLLECTOR')).map((member) => ({ value: member.id, label: member.fullName })),
    ],
    [members.data],
  );
}
