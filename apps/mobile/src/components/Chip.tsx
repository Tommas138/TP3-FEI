import { Pressable, StyleSheet, Text } from 'react-native';
import { colores, fuentes, radios } from '../lib/tokens';

type Props = {
  texto: string;
  activo?: boolean;
  onPress: () => void;
};

// Píldora de categorías y filtros (design.md §6), como el Chip de la web. Activo: negro.
export function Chip({ texto, activo = false, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      // El chip mide 38: el área de toque llega a 56.
      hitSlop={{ top: 9, bottom: 9 }}
      style={({ pressed }) => [estilos.chip, activo ? estilos.activo : pressed && estilos.apretado]}
    >
      <Text style={[estilos.texto, activo && estilos.textoActivo]}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  chip: {
    height: 38,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: radios.chip,
    borderWidth: 1,
    borderColor: colores.linea,
  },
  activo: {
    backgroundColor: colores.negro,
    borderColor: colores.negro,
  },
  apretado: {
    backgroundColor: colores.fondo,
  },
  texto: {
    fontFamily: fuentes.sans[500],
    fontSize: 15,
    color: colores.gris700,
  },
  textoActivo: {
    fontFamily: fuentes.sans[600],
    color: colores.blanco,
  },
});
