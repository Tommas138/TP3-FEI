// expo-notifications, si el celular la soporta. Un Expo Go más viejo que el SDK del proyecto
// puede no traer alguno de sus módulos nativos, y la librería falla apenas se importa. Sin
// esto, la app entera no abre; así solo se quedan sin avisos (decisión 047).
type Notificaciones = typeof import('expo-notifications');

function cargar(): Notificaciones | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as Notificaciones;
  } catch {
    return null;
  }
}

export const Notifications = cargar();
