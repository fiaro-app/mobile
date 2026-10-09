/**
 * Lo que un campo de formulario necesita para dibujarse y responder. Es el contrato entre los hooks
 * de lógica (que usan react-hook-form) y los componentes de diseño (que no saben que existe): los
 * componentes reciben esto y nada más, así se pueden cambiar la librería de formularios o el diseño
 * por separado.
 */
export interface FieldProps {
  readonly value: string;
  /** Mensaje de validación propio del campo, o `null`. */
  readonly error: string | null;
  /** Marca el campo en rojo sin mensaje propio (el error se muestra en otro lugar). */
  readonly invalid?: boolean;
  readonly onChangeText: (text: string) => void;
  readonly onBlur: () => void;
}
