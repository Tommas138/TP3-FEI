import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colores, fuentes, medidas } from '../lib/tokens';

// Barra de pestañas de la app (decisión 045). No tiene pantalla de referencia: es texto solo,
// con la pestaña activa en negro y una raya lima arriba, como el resto de los activos de design.md.
export function BarraDePestanas({ state, descriptors, navigateToTab, insets }: BottomTabBarProps) {
  return (
    <View style={[estilos.barra, { paddingBottom: insets.bottom }]}>
      {state.routes.map((ruta, i) => {
        const activa = state.index === i;
        const titulo = descriptors[ruta.key].options.title ?? ruta.name;

        return (
          <Pressable
            key={ruta.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: activa }}
            onPress={() => !activa && navigateToTab(ruta.key)}
            style={({ pressed }) => [estilos.pestana, pressed && !activa && estilos.apretada]}
          >
            <View style={[estilos.raya, activa && estilos.rayaActiva]} />
            <Text style={[estilos.texto, activa && estilos.textoActivo]}>{titulo}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    backgroundColor: colores.blanco,
    borderTopWidth: 1,
    borderTopColor: colores.linea,
  },
  pestana: {
    flex: 1,
    height: medidas.toque,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apretada: {
    opacity: 0.6,
  },
  raya: {
    position: 'absolute',
    top: -1,
    width: 32,
    height: 3,
    borderRadius: 2,
  },
  rayaActiva: {
    backgroundColor: colores.lima,
  },
  texto: {
    fontFamily: fuentes.sans[500],
    fontSize: 15,
    color: colores.gris500,
  },
  textoActivo: {
    fontFamily: fuentes.sans[600],
    color: colores.negro,
  },
});
