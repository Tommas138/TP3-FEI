import type { FilaDeRanking, TorneoDelCalendario } from '@setpoint/shared';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colores, fuentes, radios, tabular } from '../../lib/tokens';
import { Casilleros } from './Casilleros';

type Props = {
  fila: FilaDeRanking;
  torneosDelCalendario: TorneoDelCalendario[];
  // La fila de quien mira: la única con fondo, y dice "Vos" (ranking.html).
  propia: boolean;
  abierta: boolean;
  alTocar: () => void;
};

// Puesto, nombre y total, sin scroll horizontal. Al tocarla se abren sus casilleros.
export function FilaRanking({ fila, torneosDelCalendario, propia, abierta, alTocar }: Props) {
  const nombre = `${fila.nombre} ${fila.apellido}`;

  return (
    <View style={!propia && estilos.separador}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: abierta }}
        accessibilityLabel={`${fila.puesto}º, ${propia ? `vos, ${nombre}` : nombre}, ${fila.puntos} puntos`}
        onPress={alTocar}
        style={({ pressed }) => [estilos.fila, propia && estilos.filaPropia, pressed && !propia && estilos.apretada]}
      >
        <Text style={[estilos.puesto, propia && estilos.textoPropio]}>{fila.puesto}</Text>
        <View style={estilos.nombre}>
          <Text style={[estilos.textoNombre, propia && estilos.nombrePropio]} numberOfLines={1}>
            {propia ? 'Vos' : nombre}
          </Text>
          {propia && <View style={estilos.punto} />}
        </View>
        <Text style={[estilos.total, propia && estilos.textoPropio]}>{fila.puntos}</Text>
      </Pressable>
      {abierta && torneosDelCalendario.length > 0 && (
        <View style={estilos.desglose}>
          <Casilleros fila={fila} torneosDelCalendario={torneosDelCalendario} variante="clara" />
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  separador: {
    borderBottomWidth: 1,
    borderBottomColor: colores.lineaSuave,
  },
  fila: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // Se sale 12 hacia los costados para que el fondo no quede pegado al texto.
  filaPropia: {
    height: 60,
    marginHorizontal: -12,
    paddingHorizontal: 12,
    borderRadius: radios.control,
    backgroundColor: colores.limaTenue,
  },
  apretada: {
    backgroundColor: colores.fondo,
  },
  puesto: {
    width: 26,
    fontFamily: fuentes.mono[400],
    fontSize: 15,
    color: colores.gris500,
    ...tabular,
  },
  nombre: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  textoNombre: {
    flexShrink: 1,
    fontFamily: fuentes.sans[500],
    fontSize: 18,
    color: colores.negro,
  },
  nombrePropio: {
    fontFamily: fuentes.sans[700],
  },
  punto: {
    width: 7,
    height: 7,
    borderRadius: radios.chip,
    backgroundColor: colores.lima,
  },
  total: {
    width: 58,
    textAlign: 'right',
    fontFamily: fuentes.mono[500],
    fontSize: 18,
    color: colores.negro,
    ...tabular,
  },
  textoPropio: {
    fontFamily: fuentes.mono[600],
    color: colores.negro,
  },
  desglose: {
    paddingBottom: 12,
  },
});
