import type { FilaDeRanking, TorneoDelCalendario } from '@setpoint/shared';
import { StyleSheet, Text, View } from 'react-native';
import { colores, fuentes, radios, tabular } from '../../lib/tokens';

type Props = {
  fila: FilaDeRanking;
  torneosDelCalendario: TorneoDelCalendario[];
  // Oscura: adentro de la tarjeta negra, con el último torneo que sumó en lima. Clara: el desglose
  // que se abre al tocar una fila de la tabla.
  variante: 'oscura' | 'clara';
};

// El último torneo del calendario que le dio puntos: el de año más nuevo y, en el mismo año, el
// que va después en el calendario.
function ultimoQueSumo(fila: FilaDeRanking, torneos: TorneoDelCalendario[]) {
  const orden = (etapaId: number) => torneos.findIndex((t) => t.id === etapaId);
  const ultimo = [...fila.casilleros].sort((a, b) => b.anio - a.anio || orden(b.etapaId) - orden(a.etapaId))[0];
  return ultimo?.etapaId ?? null;
}

// Un casillero por torneo del calendario, con su rótulo de tres letras (design.md §8). Sin el año,
// como en ranking.html: con el año, a 15 px no entran cinco en un celular angosto.
export function Casilleros({ fila, torneosDelCalendario, variante }: Props) {
  const oscura = variante === 'oscura';
  const destacado = oscura ? ultimoQueSumo(fila, torneosDelCalendario) : null;

  return (
    <View style={estilos.grilla}>
      {torneosDelCalendario.map((torneo) => {
        const puntos = fila.casilleros.find((c) => c.etapaId === torneo.id)?.puntos ?? 0;
        const enLima = torneo.id === destacado;
        return (
          <View
            key={torneo.id}
            accessible
            accessibilityLabel={`${torneo.nombre}: ${puntos} puntos`}
            style={[estilos.casillero, oscura ? estilos.casilleroOscuro : estilos.casilleroClaro, enLima && estilos.casilleroLima]}
          >
            <Text style={[estilos.rotulo, enLima && estilos.textoSobreLima]}>{torneo.nombre.slice(0, 3).toLowerCase()}</Text>
            <Text
              style={[
                estilos.puntos,
                oscura ? estilos.puntosOscuro : puntos > 0 ? estilos.puntosClaro : estilos.puntosVacio,
                enLima && [estilos.textoSobreLima, estilos.puntosLima],
              ]}
            >
              {puntos}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  grilla: {
    flexDirection: 'row',
    gap: 5,
  },
  casillero: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 9,
    borderRadius: radios.control,
  },
  casilleroOscuro: {
    backgroundColor: colores.carbon,
  },
  casilleroClaro: {
    backgroundColor: colores.fondo,
  },
  casilleroLima: {
    backgroundColor: colores.lima,
  },
  rotulo: {
    fontFamily: fuentes.mono[400],
    fontSize: 15,
    color: colores.gris500,
  },
  puntos: {
    fontFamily: fuentes.mono[500],
    fontSize: 17,
    ...tabular,
  },
  puntosOscuro: {
    color: colores.blanco,
  },
  puntosClaro: {
    color: colores.negro,
  },
  puntosVacio: {
    color: colores.gris400,
  },
  // El negro sobre lima llega a 17:1 (design.md §3).
  textoSobreLima: {
    color: colores.negro,
  },
  puntosLima: {
    fontFamily: fuentes.mono[600],
  },
});
