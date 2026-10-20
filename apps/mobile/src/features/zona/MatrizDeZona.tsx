import type { FilaDePosiciones, PartidoDeMiZona } from '@setpoint/shared';
import { StyleSheet, Text, View } from 'react-native';
import { diaCorto } from '../../lib/fechas';
import { colores, fuentes, radios, tabular } from '../../lib/tokens';

type Props = {
  filas: FilaDePosiciones[];
  partidos: PartidoDeMiZona[];
};

const CON_RESULTADO = new Set(['JUGADA', 'WALKOVER', 'ABANDONO']);

// "san": tres letras del apellido, como los encabezados de la referencia.
const abreviar = (apellido: string) => apellido.slice(0, 3).toLowerCase();

// La zona como todos contra todos: la fila es lo que hizo cada uno, la columna contra quién.
// Verde donde ganó, gris donde perdió, punteado donde nadie coordinó.
export function MatrizDeZona({ filas, partidos }: Props) {
  return (
    <View style={estilos.marco}>
      <View style={[estilos.fila, estilos.encabezado]}>
        <View style={[estilos.columnaNombre, estilos.esquina]} />
        {filas.map((f) => (
          <Text key={f.jugadorId} style={[estilos.celda, estilos.textoEncabezado]}>
            {abreviar(f.apellido)}
          </Text>
        ))}
      </View>
      {filas.map((fila, i) => (
        <View key={fila.jugadorId} style={[estilos.fila, i < filas.length - 1 && estilos.conLinea]}>
          <View style={estilos.columnaNombre}>
            <Text style={estilos.nombre} numberOfLines={1}>
              {fila.apellido}
            </Text>
          </View>
          {filas.map((rival) => (
            <Celda key={rival.jugadorId} jugadorId={fila.jugadorId} rivalId={rival.jugadorId} partidos={partidos} />
          ))}
        </View>
      ))}
    </View>
  );
}

function Celda({ jugadorId, rivalId, partidos }: { jugadorId: number; rivalId: number; partidos: PartidoDeMiZona[] }) {
  if (jugadorId === rivalId) return <View style={[estilos.celda, estilos.contraSiMismo]} />;

  const partido = partidos.find(
    (p) => (p.jugadorAId === jugadorId && p.jugadorBId === rivalId) || (p.jugadorAId === rivalId && p.jugadorBId === jugadorId),
  );
  if (!partido) return <View style={estilos.celda} />;

  if (!CON_RESULTADO.has(partido.estado)) {
    return (
      <View style={estilos.celda}>
        {partido.fechaAcordada ? (
          <Text style={estilos.fecha}>{diaCorto(partido.fechaAcordada)}</Text>
        ) : (
          <View style={estilos.sinCoordinar} />
        )}
      </View>
    );
  }

  const gano = partido.ganadorId === jugadorId;
  const esA = partido.jugadorAId === jugadorId;
  // Los games desde quien está en la fila. El W.O. no guarda sets (decisión 016).
  const renglones =
    partido.estado === 'WALKOVER'
      ? ['W.O.']
      : [
          ...partido.sets.map((s) => (esA ? `${s.gamesA}-${s.gamesB}` : `${s.gamesB}-${s.gamesA}`)),
          ...(partido.estado === 'ABANDONO' ? ['ab.'] : []),
        ];

  return (
    <View style={[estilos.celda, gano && estilos.gano]}>
      {renglones.map((r, i) => (
        <Text key={i} style={[estilos.games, gano ? estilos.gamesGanados : estilos.gamesPerdidos]}>
          {r}
        </Text>
      ))}
    </View>
  );
}

export function LeyendaDeZona() {
  return (
    <View style={estilos.leyenda}>
      <View style={estilos.itemLeyenda}>
        <View style={[estilos.muestra, estilos.gano, estilos.muestraGano]} />
        <Text style={estilos.textoLeyenda}>ganó</Text>
      </View>
      <View style={estilos.itemLeyenda}>
        <View style={[estilos.muestra, estilos.muestraSinCoordinar]} />
        <Text style={estilos.textoLeyenda}>sin coordinar</Text>
      </View>
      <View style={estilos.itemLeyenda}>
        <Text style={estilos.fecha}>sáb 14</Text>
        <Text style={estilos.textoLeyenda}>fecha acordada</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  marco: {
    borderWidth: 1,
    borderColor: colores.linea,
    borderRadius: radios.tarjeta,
    overflow: 'hidden',
  },
  fila: {
    flexDirection: 'row',
  },
  conLinea: {
    borderBottomWidth: 1,
    borderBottomColor: colores.linea,
  },
  encabezado: {
    backgroundColor: colores.fondoTabla,
    borderBottomWidth: 1,
    borderBottomColor: colores.linea,
  },
  columnaNombre: {
    width: 86,
    height: 54,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: colores.linea,
  },
  // La esquina del encabezado: tan alta como las abreviaturas, no como una fila.
  esquina: {
    height: 'auto',
  },
  textoEncabezado: {
    height: 'auto',
    paddingVertical: 9,
    fontFamily: fuentes.mono[400],
    fontSize: 11,
    color: colores.gris500,
    textAlign: 'center',
  },
  nombre: {
    fontFamily: fuentes.sans[600],
    fontSize: 13,
    color: colores.negro,
  },
  celda: {
    flex: 1,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  contraSiMismo: {
    backgroundColor: colores.lineaSuave,
  },
  gano: {
    backgroundColor: colores.limaTenue,
  },
  games: {
    fontFamily: fuentes.mono[400],
    fontSize: 12,
    ...tabular,
  },
  gamesGanados: {
    fontFamily: fuentes.mono[600],
    color: colores.negro,
  },
  gamesPerdidos: {
    color: colores.gris400,
  },
  fecha: {
    fontFamily: fuentes.mono[400],
    fontSize: 11,
    color: colores.gris500,
    ...tabular,
  },
  sinCoordinar: {
    width: 42,
    height: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colores.gris300,
    borderRadius: 5,
  },
  leyenda: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 16,
  },
  itemLeyenda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  muestra: {
    width: 16,
    height: 12,
    borderRadius: 3,
    borderWidth: 1,
  },
  muestraGano: {
    borderColor: colores.linea,
  },
  muestraSinCoordinar: {
    borderStyle: 'dashed',
    borderColor: colores.gris300,
  },
  textoLeyenda: {
    fontFamily: fuentes.sans[400],
    fontSize: 13,
    color: colores.gris500,
  },
});
