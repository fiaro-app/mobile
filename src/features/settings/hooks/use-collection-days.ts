import { useState } from 'react';
import { patchLender } from '@/features/settings/api/settings-api';
import { SETTINGS_COPY, settingsFailureMessage } from '@/features/settings/content/messages';
import { SETTINGS_KEY } from '@/features/settings/hooks/use-settings-data';
import { sameWeekdays, toggleWeekday, type LenderSettings, type Weekday } from '@/features/settings/lib/settings-schemas';
import { useSaveAction } from '@/lib/hooks/use-save-action';

/** Sección "Días sin cobro". */
export interface CollectionDays {
  readonly weekdays: readonly Weekday[];
  readonly skipHolidays: boolean;
  readonly error: string | null;
  readonly notice: string | null;
  readonly busy: boolean;
  readonly dirty: boolean;
  readonly toggle: (day: Weekday, checked: boolean) => void;
  readonly setSkipHolidays: (value: boolean) => void;
  readonly save: () => void;
}

/**
 * Días de la semana sin cobro y festivos nacionales. El calendario del API mueve las cuotas de esos días al siguiente día de
 * cobro, así que cambiar esto cambia los saldos y la mora de TODOS los préstamos: por eso se invalidan las consultas de
 * préstamos, ruta y Resumen al guardar.
 */
export function useCollectionDays(settings: LenderSettings | undefined): CollectionDays {
  const [draftDays, setDraftDays] = useState<readonly Weekday[] | null>(null);
  const [draftHolidays, setDraftHolidays] = useState<boolean | null>(null);
  const action = useSaveAction(settingsFailureMessage);
  const savedDays = settings?.nonWorkingWeekdays ?? [];
  const weekdays = draftDays ?? savedDays;
  const skipHolidays = draftHolidays ?? settings?.skipNationalHolidays ?? false;
  return {
    weekdays,
    skipHolidays,
    error: action.error,
    notice: action.notice,
    busy: action.busy,
    dirty: !sameWeekdays(weekdays, savedDays) || skipHolidays !== (settings?.skipNationalHolidays ?? false),
    toggle: (day, checked) => {
      setDraftDays(toggleWeekday(weekdays, day, checked));
      action.clear();
    },
    setSkipHolidays: (value) => {
      setDraftHolidays(value);
      action.clear();
    },
    save: () => {
      void action
        .run(() => patchLender({ nonWorkingWeekdays: weekdays, skipNationalHolidays: skipHolidays }), SETTINGS_COPY.days.saved, [SETTINGS_KEY, ['admin', 'loans'], ['admin', 'dashboard'], ['collector', 'route']])
        .then((saved) => {
          if (saved) {
            setDraftDays(null);
            setDraftHolidays(null);
          }
        });
    },
  };
}
