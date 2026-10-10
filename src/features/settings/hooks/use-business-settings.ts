import { useState } from 'react';
import { patchLender } from '@/features/settings/api/settings-api';
import { SETTINGS_COPY, settingsFailureMessage } from '@/features/settings/content/messages';
import { SETTINGS_KEY } from '@/features/settings/hooks/use-settings-data';
import { brandColorError } from '@/features/settings/lib/brand-palette';
import type { LenderSettings } from '@/features/settings/lib/settings-schemas';
import { applyBrandColor, DEFAULT_BRAND_COLOR } from '@/lib/theme/brand';
import { useSaveAction } from '@/lib/hooks/use-save-action';

/** Sección "Tu negocio": el nombre. */
export interface BusinessSettings {
  readonly name: string;
  readonly error: string | null;
  readonly notice: string | null;
  readonly busy: boolean;
  readonly dirty: boolean;
  readonly setName: (text: string) => void;
  readonly save: () => void;
}

/** Sección "Color de marca": el color elegido de la paleta. */
export interface BrandSettings {
  readonly color: string;
  readonly error: string | null;
  readonly notice: string | null;
  readonly busy: boolean;
  readonly dirty: boolean;
  readonly choose: (hex: string) => void;
  readonly save: () => void;
  readonly reset: () => void;
}

/**
 * Nombre de la financiera: se valida (2 a 120 caracteres) y se guarda con `PATCH /lender`. Al guardar se refresca el menú
 * lateral, que muestra el nombre.
 */
export function useBusinessSettings(settings: LenderSettings | undefined): BusinessSettings {
  const [draft, setDraft] = useState<string | null>(null);
  const action = useSaveAction(settingsFailureMessage);
  const [validation, setValidation] = useState<string | null>(null);
  const name = draft ?? settings?.name ?? '';
  return {
    name,
    error: validation ?? action.error,
    notice: action.notice,
    busy: action.busy,
    dirty: draft !== null && draft.trim() !== settings?.name,
    setName: (text) => {
      setDraft(text);
      setValidation(null);
      action.clear();
    },
    save: () => {
      const trimmed = name.trim();
      if (trimmed.length < 2 || trimmed.length > 120) {
        setValidation(SETTINGS_COPY.nameInvalid);
        return;
      }
      void action.run(() => patchLender({ name: trimmed }), SETTINGS_COPY.business.saved, [SETTINGS_KEY, ['lender']]).then((saved) => {
        if (saved) setDraft(null);
      });
    },
  };
}

/**
 * Color de marca: se elige de la paleta (todos pasan el contraste con texto blanco), se guarda con `PATCH /lender` y se aplica
 * al instante en la app. "Usar el de Fiaro" lo quita (`brandColor: null`) y vuelve al índigo.
 */
export function useBrandSettings(settings: LenderSettings | undefined): BrandSettings {
  const [draft, setDraft] = useState<string | null>(null);
  const action = useSaveAction(settingsFailureMessage);
  const [validation, setValidation] = useState<string | null>(null);
  const saved = settings?.brandColor ?? DEFAULT_BRAND_COLOR;
  const color = draft ?? saved;
  return {
    color,
    error: validation ?? action.error,
    notice: action.notice,
    busy: action.busy,
    dirty: draft !== null && draft.toUpperCase() !== saved.toUpperCase(),
    choose: (hex) => {
      setDraft(hex);
      setValidation(null);
      action.clear();
    },
    save: () => {
      const problem = brandColorError(color);
      if (problem) {
        setValidation(problem);
        return;
      }
      void action.run(() => patchLender({ brandColor: color.toUpperCase() }), SETTINGS_COPY.brand.saved, [SETTINGS_KEY, ['lender']]).then((value) => {
        if (value) {
          applyBrandColor(color);
          setDraft(null);
        }
      });
    },
    reset: () => {
      void action.run(() => patchLender({ brandColor: null }), SETTINGS_COPY.brand.saved, [SETTINGS_KEY, ['lender']]).then((value) => {
        if (value) {
          applyBrandColor(DEFAULT_BRAND_COLOR);
          setDraft(null);
        }
      });
    },
  };
}
