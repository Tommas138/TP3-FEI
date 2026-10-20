// La app abre en una pestaña (decisión 045). Cuando llegue Cuándo juego, la vista principal
// según 04-flujo-jugador §7, abre en esa.
import { Redirect } from 'expo-router';

export default function Inicio() {
  return <Redirect href="/ranking" />;
}
