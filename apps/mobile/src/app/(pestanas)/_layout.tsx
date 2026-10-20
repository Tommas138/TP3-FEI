// Las pantallas del jugador con sesión y circuito, con una barra de pestañas abajo (decisión 045).
import { Tabs } from 'expo-router';
import { BarraDePestanas } from '../../components/BarraDePestanas';

export default function Pestanas() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BarraDePestanas {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Cuándo juego' }} />
      <Tabs.Screen name="zona" options={{ title: 'Mi zona' }} />
      <Tabs.Screen name="ranking" options={{ title: 'Ranking' }} />
    </Tabs>
  );
}
