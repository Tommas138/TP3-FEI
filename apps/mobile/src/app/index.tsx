// Por ahora la app abre en el ranking. Cuando llegue la segunda pantalla (Cuándo juego, paso 4) se
// decide cómo se navega entre las dos.
import { Redirect } from 'expo-router';

export default function Inicio() {
  return <Redirect href="/ranking" />;
}
