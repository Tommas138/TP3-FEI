import { StyleSheet, View } from 'react-native';
import { colores } from '../lib/tokens';

// La marca de las pantallas del jugador (docs/pantallas/jugador): el cuadrado negro con el punto
// lima. La de la web es al revés.
export function Logo() {
  return (
    <View style={estilos.cuadro}>
      <View style={estilos.punto} />
    </View>
  );
}

const estilos = StyleSheet.create({
  cuadro: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: colores.negro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  punto: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: colores.lima,
  },
});
