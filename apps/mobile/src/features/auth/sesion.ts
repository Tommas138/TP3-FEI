import { respuestaIngresoJugadorSchema, type RespuestaIngresoJugador } from '@setpoint/shared';
import * as SecureStore from 'expo-secure-store';

// La sesión queda cifrada con el Keystore de Android (decisión 041).
const CLAVE_SESION = 'setpoint.sesion';
// El circuito que eligió, si juega en varios (decisión 040). Va aparte porque no viene de la API.
const CLAVE_CIRCUITO = 'setpoint.circuito';

export type Sesion = RespuestaIngresoJugador;

export async function guardarSesion(sesion: Sesion) {
  await SecureStore.setItemAsync(CLAVE_SESION, JSON.stringify(sesion));
}

// Una sesión rota o guardada por otra versión de la app se descarta: se vuelve a ingresar.
export async function leerSesion(): Promise<Sesion | null> {
  try {
    const guardada = await SecureStore.getItemAsync(CLAVE_SESION);
    if (!guardada) return null;
    const resultado = respuestaIngresoJugadorSchema.safeParse(JSON.parse(guardada));
    return resultado.success ? resultado.data : null;
  } catch {
    return null;
  }
}

export async function guardarCircuito(jugadorId: number) {
  await SecureStore.setItemAsync(CLAVE_CIRCUITO, String(jugadorId));
}

export async function leerCircuito(): Promise<number | null> {
  try {
    const jugadorId = Number(await SecureStore.getItemAsync(CLAVE_CIRCUITO));
    return Number.isInteger(jugadorId) && jugadorId > 0 ? jugadorId : null;
  } catch {
    return null;
  }
}

export async function borrarSesion() {
  await Promise.all([SecureStore.deleteItemAsync(CLAVE_SESION), SecureStore.deleteItemAsync(CLAVE_CIRCUITO)]);
}
