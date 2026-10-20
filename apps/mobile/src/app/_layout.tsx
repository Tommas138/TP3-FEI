// Un import por peso: el índice de cada paquete trae los 26 archivos (itálicas incluidas) y Metro
// los empaquetaría todos.
import { GeistMono_400Regular } from '@expo-google-fonts/geist-mono/400Regular';
import { GeistMono_500Medium } from '@expo-google-fonts/geist-mono/500Medium';
import { GeistMono_600SemiBold } from '@expo-google-fonts/geist-mono/600SemiBold';
import { InstrumentSans_400Regular } from '@expo-google-fonts/instrument-sans/400Regular';
import { InstrumentSans_500Medium } from '@expo-google-fonts/instrument-sans/500Medium';
import { InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans/600SemiBold';
import { InstrumentSans_700Bold } from '@expo-google-fonts/instrument-sans/700Bold';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SesionProvider, useSesion } from '../features/auth/SesionProvider';

// La splash queda hasta que están las fuentes y se leyó la sesión guardada: así ningún texto aparece
// con la fuente del sistema y no se ve el ingreso un instante antes de saber que había sesión.
// Las fuentes se cargan en tiempo de ejecución porque Expo Go no lee el plugin de expo-font.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const [cargadas, error] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
    GeistMono_400Regular,
    GeistMono_500Medium,
    GeistMono_600SemiBold,
  });

  return (
    <QueryClientProvider client={queryClient}>
      <SesionProvider>
        {/* Si una fuente no carga, la app sigue con la del sistema en vez de quedarse en la splash. */}
        <Navegacion fuentesListas={cargadas || error !== null} />
      </SesionProvider>
    </QueryClientProvider>
  );
}

// Sin sesión solo se llega al ingreso (decisión 042). Con sesión, al inicio si ya hay circuito y a
// elegirlo si juega en varios y todavía no eligió (decisión 040).
function Navegacion({ fuentesListas }: { fuentesListas: boolean }) {
  const { cargando, sesion, perfil } = useSesion();
  const listo = fuentesListas && !cargando;

  useEffect(() => {
    if (listo) SplashScreen.hideAsync();
  }, [listo]);

  if (!listo) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={perfil !== null} redirectTo={sesion ? '/circuitos' : '/ingresar'}>
          <Stack.Screen name="index" />
          <Stack.Screen name="ranking" />
        </Stack.Protected>
        <Stack.Protected guard={sesion !== null} redirectTo="/ingresar">
          <Stack.Screen name="circuitos" />
        </Stack.Protected>
        <Stack.Protected guard={sesion === null} redirectTo="/">
          <Stack.Screen name="ingresar" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
