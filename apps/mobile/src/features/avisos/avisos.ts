// Avisos push (F11, decisión 047). El fixture lo avisa la API por el servicio de Expo; el
// recordatorio antes de cada partido lo programa la app en el celular (recordatorios.ts).
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { pedir } from '../../lib/api';

// El mismo id que usa la API al mandar (channelId).
export const CANAL = 'avisos';

// Con la app abierta, el aviso se muestra igual que con la app cerrada.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

// En Android 8 o más, sin canal no se muestra nada.
async function crearCanal() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CANAL, {
    name: 'Avisos del torneo',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

// Pide permiso una sola vez: si ya lo negó, no se le vuelve a preguntar en cada apertura.
export async function pedirPermiso() {
  await crearCanal();
  const actual = await Notifications.getPermissionsAsync();
  if (actual.granted || !actual.canAskAgain) return actual.granted;
  return (await Notifications.requestPermissionsAsync()).granted;
}

// El token del servicio de Expo, o null donde no hay: el emulador, Expo Go en Android (desde el
// SDK 53 no recibe avisos remotos) o un APK generado sin el proyecto de EAS.
async function tokenDelCelular() {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!Device.isDevice || !projectId) return null;
  try {
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch {
    return null;
  }
}

// Le dice a la API a qué celular mandarle los avisos de esta cuenta. Si no se puede, la app
// sigue igual: solo no llegan los avisos del servidor.
export async function registrarCelular(slug: string, token: string) {
  if (!(await pedirPermiso())) return;
  const tokenDeAvisos = await tokenDelCelular();
  if (!tokenDeAvisos) return;
  await pedir('PUT', `/api/jugador/${slug}/dispositivo`, { token: tokenDeAvisos }, token).catch(() => {});
}

// Al cerrar sesión: el celular deja de recibir los avisos de esta cuenta y se borran los
// recordatorios, para que en un celular compartido no le lleguen a quien entre después.
export async function olvidarCelular(slug: string, token: string) {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  const tokenDeAvisos = await tokenDelCelular();
  if (!tokenDeAvisos) return;
  await pedir('DELETE', `/api/jugador/${slug}/dispositivo`, { token: tokenDeAvisos }, token).catch(() => {});
}
