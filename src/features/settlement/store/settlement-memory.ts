import AsyncStorage from '@react-native-async-storage/async-storage';

const keyOf = (userId: string, date: string) => `fiaro.settlement.${userId}.${date}`;

/**
 * Recuerda en el teléfono el `id` del cuadre que la persona envió ese día. El API no ofrece "mi cuadre de
 * hoy" a un cobrador (`QUERY /daily-settlements` es del prestamista y sin filtro listaría el de todos), así
 * que con este `id` se consulta `GET /daily-settlements/:id` para ver si lo aprobaron o rechazaron.
 */
export async function rememberSettlement(userId: string, date: string, settlementId: string): Promise<void> {
  await AsyncStorage.setItem(keyOf(userId, date), settlementId);
}

/** Olvida el cuadre de ese día (cuando el cobrador lo cancela). */
export async function forgetSettlement(userId: string, date: string): Promise<void> {
  await AsyncStorage.removeItem(keyOf(userId, date));
}

/** El `id` del cuadre de ese día, o `null` si no se envió desde este teléfono. */
export async function recallSettlement(userId: string, date: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(keyOf(userId, date));
  } catch {
    return null;
  }
}
