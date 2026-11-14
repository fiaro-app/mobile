import { useState } from 'react';
import type { FilterOption } from '@/components/molecules/FilterBar';
import { ALL_COLLECTORS, useCollectorOptions } from '@/features/team/hooks/use-collector-options';

/** Estado de un filtro por cobrador con su hoja de opciones. */
export interface CollectorFilter {
  /** `ALL_COLLECTORS` (`''`) son todos. */
  readonly id: string;
  /** El id para la API, o `null` si son todos. */
  readonly applied: string | null;
  readonly label: string;
  readonly options: readonly FilterOption<string>[];
  readonly open: boolean;
  readonly openSheet: () => void;
  readonly closeSheet: () => void;
  readonly select: (id: string) => void;
}

/** Lógica del filtro por cobrador de las listas del administrador (cobros, cuadres, estadísticas). */
export function useCollectorFilter(): CollectorFilter {
  const options = useCollectorOptions();
  const [id, setId] = useState(ALL_COLLECTORS);
  const [open, setOpen] = useState(false);
  return {
    id,
    applied: id === ALL_COLLECTORS ? null : id,
    label: options.find((option) => option.value === id)?.label ?? 'Todos los cobradores',
    options,
    open,
    openSheet: () => {
      setOpen(true);
    },
    closeSheet: () => {
      setOpen(false);
    },
    select: (value) => {
      setId(value);
      setOpen(false);
    },
  };
}
