// Lo que no va en app.json porque depende de cómo se genera el APK:
// - El google-services.json del proyecto de Firebase de los avisos (decisión 047). No se
//   commitea; en EAS es una variable de tipo archivo. Sin él, el APK funciona igual y solo no
//   recibe el aviso del fixture.
// - El permiso para conectarse por http, solo en el APK de prueba (decisión 048).
import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
  },
  plugins: [
    ...(config.plugins ?? []),
    // Android bloquea http en los APK desde la versión 9. El de prueba apunta a la API de la
    // notebook en la red de casa, que no tiene https; PERMITIR_HTTP lo pone el perfil preview
    // de eas.json. Un APK sin esa variable exige https.
    ...(process.env.PERMITIR_HTTP === '1'
      ? [['expo-build-properties', { android: { usesCleartextTraffic: true } }] as [string, object]]
      : []),
  ],
});
