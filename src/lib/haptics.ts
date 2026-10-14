import * as Haptics from 'expo-haptics';

/**
 * Vibración corta de éxito (confirmar un pago). No falla en dispositivos o simuladores sin motor
 * háptico: el aviso táctil es un refuerzo, nunca puede romper la acción.
 */
export function successHaptic(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}
