import { explicarDesempate, type MiZona } from '@setpoint/shared';
import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colores, fuentes, tabular } from '../../lib/tokens';

// Las posiciones con la línea de corte y, abajo, por qué quedó cada uno de su lado del corte.
// El cálculo y la explicación son los mismos de la web (F07).
export function PosicionesDeZona({ zona, jugadorId }: { zona: MiZona; jugadorId: number }) {
  const { filas, clasificanPorGrupo, usaRanking } = zona;
  const [justoArriba, justoAbajo] = [filas[clasificanPorGrupo - 1], filas[clasificanPorGrupo]];
  const desempate = justoArriba && justoAbajo ? explicarDesempate(justoArriba, justoAbajo, usaRanking) : null;

  return (
    <View style={estilos.bloque}>
      <View style={estilos.titulo}>
        <Text style={estilos.textoTitulo}>Posiciones</Text>
        <Text style={estilos.columnas}>pg · sets · games</Text>
      </View>
      <View>
        {filas.map((fila, i) => {
          const clasifica = fila.destino === 'campeonato';
          const antesDelCorte = i === clasificanPorGrupo - 1 && i < filas.length - 1;
          return (
            <Fragment key={fila.jugadorId}>
              <View style={[estilos.fila, !antesDelCorte && i < filas.length - 1 && estilos.conLinea]}>
                <Text style={[estilos.posicion, !clasifica && estilos.apagado]}>{fila.posicion}</Text>
                <View style={estilos.nombre}>
                  <View style={[estilos.punto, clasifica && estilos.puntoClasifica]} />
                  <Text
                    style={[estilos.apellido, !clasifica && estilos.apellidoAfuera, fila.jugadorId === jugadorId && estilos.propio]}
                    numberOfLines={1}
                  >
                    {fila.apellido}
                  </Text>
                </View>
                <Text style={[estilos.ganados, !clasifica && estilos.ganadosAfuera]}>{fila.partidosGanados}</Text>
                <Text style={[estilos.dato, !clasifica && estilos.apagado]}>
                  {fila.setsGanados}-{fila.setsPerdidos}
                </Text>
                <Text style={[estilos.dato, estilos.derecha, !clasifica && estilos.apagado]}>
                  {fila.gamesGanados}-{fila.gamesPerdidos}
                </Text>
              </View>
              {antesDelCorte && (
                <View style={estilos.corte}>
                  <View style={estilos.raya} />
                  <Text style={estilos.textoCorte}>corte · campeonato arriba</Text>
                  <View style={estilos.raya} />
                </View>
              )}
            </Fragment>
          );
        })}
      </View>
      {desempate && <Text style={estilos.desempate}>{desempate}</Text>}
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: {
    gap: 10,
  },
  titulo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  textoTitulo: {
    fontFamily: fuentes.sans[600],
    fontSize: 20,
    letterSpacing: -0.4,
    color: colores.negro,
  },
  columnas: {
    fontFamily: fuentes.mono[400],
    fontSize: 12,
    color: colores.gris400,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    gap: 8,
  },
  conLinea: {
    borderBottomWidth: 1,
    borderBottomColor: colores.lineaSuave,
  },
  posicion: {
    width: 22,
    fontFamily: fuentes.mono[400],
    fontSize: 13,
    color: colores.gris500,
    ...tabular,
  },
  nombre: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  punto: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: colores.linea,
  },
  puntoClasifica: {
    backgroundColor: colores.lima,
  },
  apellido: {
    flexShrink: 1,
    fontFamily: fuentes.sans[600],
    fontSize: 17,
    color: colores.negro,
  },
  apellidoAfuera: {
    fontFamily: fuentes.sans[500],
    color: colores.gris700,
  },
  // Tu fila: el apellido subrayado, sin otro color, para no competir con el corte.
  propio: {
    textDecorationLine: 'underline',
  },
  ganados: {
    width: 30,
    fontFamily: fuentes.mono[600],
    fontSize: 14,
    color: colores.negro,
    textAlign: 'center',
    ...tabular,
  },
  ganadosAfuera: {
    color: colores.gris700,
  },
  dato: {
    width: 46,
    fontFamily: fuentes.mono[400],
    fontSize: 13,
    color: colores.gris500,
    textAlign: 'center',
    ...tabular,
  },
  derecha: {
    width: 62,
    textAlign: 'right',
  },
  apagado: {
    color: colores.gris400,
  },
  corte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  raya: {
    flex: 1,
    height: 1,
    backgroundColor: colores.negro,
  },
  textoCorte: {
    fontFamily: fuentes.mono[400],
    fontSize: 11,
    color: colores.negro,
  },
  desempate: {
    fontFamily: fuentes.sans[400],
    fontSize: 14,
    lineHeight: 20,
    color: colores.gris500,
  },
});
