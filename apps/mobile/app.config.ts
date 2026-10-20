// Lo único de la configuración que no va en app.json: el google-services.json del proyecto de
// Firebase de los avisos (decisión 047). No se commitea; en EAS es una variable de tipo archivo.
// Sin él, el APK funciona igual y solo no recibe el aviso del fixture.
import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
  },
});
