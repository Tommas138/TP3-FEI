import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Logo } from '../../components/Logo';
import { colores, fuentes } from '../../lib/tokens';
import { useSesion } from './SesionProvider';

// El encabezado de las pantallas del jugador. El nombre del circuito abre el menú para cambiar de
// circuito o cerrar sesión (decisión 040); el chevron dice que se puede tocar.
export function EncabezadoCircuito() {
  const { perfil } = useSesion();
  const nombre = perfil?.organizacion.nombre ?? '';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${nombre}. Cambiar de circuito o cerrar sesión`}
      // El encabezado mide 26: el área de toque llega a 56.
      hitSlop={15}
      onPress={() => router.push('/circuitos')}
      style={({ pressed }) => [estilos.fila, pressed && estilos.apretado]}
    >
      <Logo />
      <Text style={estilos.nombre} numberOfLines={1}>
        {nombre}
      </Text>
      <View style={estilos.chevron} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    alignSelf: 'flex-start',
  },
  apretado: {
    opacity: 0.6,
  },
  nombre: {
    flexShrink: 1,
    fontFamily: fuentes.sans[600],
    fontSize: 16,
    letterSpacing: -0.24,
    color: colores.negro,
  },
  // Un ángulo hecho con dos bordes: para un solo ícono no se suma react-native-svg.
  chevron: {
    width: 8,
    height: 8,
    marginTop: -4,
    marginLeft: 2,
    borderRightWidth: 1.8,
    borderBottomWidth: 1.8,
    borderColor: colores.gris500,
    transform: [{ rotate: '45deg' }],
  },
});
