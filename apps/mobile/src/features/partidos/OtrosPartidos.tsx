import type { PartidoDelJugador } from '@setpoint/shared';
import { StyleSheet, Text, View } from 'react-native';
import { diaYHora } from '../../lib/fechas';
import { colores, fuentes, tabular } from '../../lib/tokens';

// El resto del torneo: los que tienen fecha más adelante y los jugados. El punto lima marca los
// que ganó.
export function OtrosPartidos({ partidos }: { partidos: PartidoDelJugador[] }) {
  return (
    <View style={estilos.lista}>
      {partidos.map((p, i) => (
        <View key={p.id} style={[estilos.fila, i < partidos.length - 1 && estilos.conLinea]}>
          <View style={estilos.nombre}>
            {p.resultado?.gano && <View style={estilos.punto} />}
            <Text style={estilos.rival} numberOfLines={1}>
              {p.rival!.nombre} {p.rival!.apellido}
            </Text>
          </View>
          <Text style={[estilos.dato, p.resultado && estilos.marcador]}>
            {p.resultado ? p.resultado.marcador : p.fechaAcordada ? diaYHora(p.fechaAcordada) : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: {
    borderWidth: 1,
    borderColor: colores.linea,
    borderRadius: 16,
    overflow: 'hidden',
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 17,
    paddingHorizontal: 18,
  },
  conLinea: {
    borderBottomWidth: 1,
    borderBottomColor: colores.linea,
  },
  nombre: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  punto: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: colores.lima,
  },
  rival: {
    flexShrink: 1,
    fontFamily: fuentes.sans[500],
    fontSize: 18,
    color: colores.negro,
  },
  dato: {
    fontFamily: fuentes.mono[400],
    fontSize: 14,
    color: colores.gris500,
    ...tabular,
  },
  marcador: {
    fontFamily: fuentes.mono[500],
    color: colores.negro,
  },
});
