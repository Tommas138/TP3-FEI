// Las pantallas del jugador con sesión y circuito, con una barra de pestañas abajo (decisión 045).
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { BarraDePestanas } from '../../components/BarraDePestanas';
import { useSesion } from '../../features/auth/SesionProvider';
import { registrarCelular } from '../../features/avisos/avisos';

export default function Pestanas() {
  const { sesion, perfil } = useSesion();
  const slug = perfil?.organizacion.slug;
  const token = sesion?.token;

  // Al entrar, y al cambiar de circuito: el celular queda anotado para recibir los avisos.
  useEffect(() => {
    if (slug && token) registrarCelular(slug, token);
  }, [slug, token]);

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BarraDePestanas {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Cuándo juego' }} />
      <Tabs.Screen name="zona" options={{ title: 'Mi zona' }} />
      <Tabs.Screen name="ranking" options={{ title: 'Ranking' }} />
    </Tabs>
  );
}
