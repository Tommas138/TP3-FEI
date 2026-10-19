import type { FilaDeRanking, TorneoDelCalendario } from '@setpoint/shared';
import { StyleSheet, Text, View } from 'react-native';
import { colores, fuentes, radios, tabular } from '../../lib/tokens';
import { Casilleros } from './Casilleros';

type Props = {
  fila: FilaDeRanking;
  jugadores: number;
  torneosDelCalendario: TorneoDelCalendario[];
};

// La tarjeta negra del ranking: tu puesto, tus puntos y tus casilleros. Sin el "+15" del HTML: la
// API no devuelve qué puntos reemplazó cada casillero (decisión 043).
export function TarjetaPropia({ fila, jugadores, torneosDelCalendario }: Props) {
  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.resumen}>
        <Text style={estilos.puesto}>
          Vas {fila.puesto}º de {jugadores}
        </Text>
        <View style={estilos.total}>
          <Text style={estilos.puntos}>{fila.puntos}</Text>
          <Text style={estilos.palabraPuntos}>{fila.puntos === 1 ? 'punto' : 'puntos'}</Text>
        </View>
      </View>
      {torneosDelCalendario.length > 0 && (
        <Casilleros fila={fila} torneosDelCalendario={torneosDelCalendario} variante="oscura" />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: colores.negro,
    borderRadius: radios.superficie,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 18,
    gap: 18,
  },
  resumen: {
    gap: 4,
  },
  puesto: {
    fontFamily: fuentes.sans[500],
    fontSize: 15,
    color: colores.gris400,
  },
  total: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  puntos: {
    fontFamily: fuentes.mono[500],
    fontSize: 52,
    letterSpacing: -2,
    color: colores.lima,
    ...tabular,
  },
  palabraPuntos: {
    fontFamily: fuentes.sans[400],
    fontSize: 17,
    color: colores.gris400,
  },
});
