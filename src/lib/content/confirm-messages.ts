/** Lo que se le pregunta a la persona antes de guardar un cambio o crear algo (igual que en el panel web). */
export const CONFIRM_COPY = {
  save: { title: '¿Guardar los cambios?', message: 'Se aplican de inmediato.', confirmLabel: 'Guardar' },
  create: { title: '¿Registrar estos datos?', message: 'Revisa que estén bien antes de continuar.', confirmLabel: 'Registrar' },
  loan: { title: '¿Registrar el préstamo?', message: 'Revisa el monto, las cuotas y la frecuencia antes de continuar.', confirmLabel: 'Sí, registrar' },
  request: { title: '¿Enviar la solicitud?', message: 'Tu administrador la revisará y te avisará si la acepta.', confirmLabel: 'Enviar' },
  cancel: 'Cancelar',
} as const;
