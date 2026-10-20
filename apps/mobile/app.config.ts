// Lo que depende de la cuenta de Expo y del proyecto de Firebase de quien genera el APK sale de
// variables de entorno, así no queda ninguna cuenta en el repo (decisión 047). Lo demás está en
// app.json. Sin estas variables la app funciona igual: solo no recibe avisos del servidor.
import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  android: {
    ...config.android,
    // Ruta al google-services.json del proyecto de Firebase. En EAS, una variable de tipo archivo.
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
  },
  extra: {
    ...config.extra,
    eas: { projectId: process.env.EAS_PROJECT_ID },
  },
});
