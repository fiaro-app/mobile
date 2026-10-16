import { useState } from 'react';
import { CONFIRM_COPY } from '@/lib/content/confirm-messages';

/** Lo que pide un `ConfirmDialog` de la pregunta previa a guardar. */
export interface ConfirmedSubmit {
  /** Se llama al pulsar "Guardar": abre la pregunta, todavía no guarda. */
  readonly ask: () => void;
  /** Propiedades listas para `<ConfirmDialog {...dialog} />`. */
  readonly dialog: {
    readonly visible: boolean;
    readonly title: string;
    readonly message: string;
    readonly cancelLabel: string;
    readonly confirmLabel: string;
    readonly onCancel: () => void;
    readonly onConfirm: () => void;
  };
}

/**
 * Pregunta antes de guardar (decisiones que cambian datos del negocio): `ask` abre el diálogo y solo si la persona confirma
 * corre el `submit` de siempre, que valida y llama al servicio.
 *
 * @param submit - El guardado de siempre.
 * @param copy - Qué se pregunta (`CONFIRM_COPY.loan`, `.save`...).
 */
export function useConfirmedSubmit(submit: () => void, copy: { readonly title: string; readonly message: string; readonly confirmLabel: string }): ConfirmedSubmit {
  const [visible, setVisible] = useState(false);
  return {
    ask: () => {
      setVisible(true);
    },
    dialog: {
      visible,
      title: copy.title,
      message: copy.message,
      cancelLabel: CONFIRM_COPY.cancel,
      confirmLabel: copy.confirmLabel,
      onCancel: () => {
        setVisible(false);
      },
      onConfirm: () => {
        setVisible(false);
        submit();
      },
    },
  };
}
