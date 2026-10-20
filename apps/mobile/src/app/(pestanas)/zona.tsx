// Mi zona (F07, F11): docs/pantallas/jugador/mi-zona.html. La matriz de todos contra todos y las
// posiciones con la línea de corte, de la zona del jugador en su torneo en curso.
import type { MiZona } from '@setpoint/shared';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EncabezadoCircuito } from '../../features/auth/EncabezadoCircuito';
import { ErrorDeCarga } from '../../features/auth/ErrorDeCarga';
import { useSesion } from '../../features/auth/SesionProvider';
import { LeyendaDeZona, MatrizDeZona } from '../../features/zona/MatrizDeZona';
import { PosicionesDeZona } from '../../features/zona/PosicionesDeZona';
import { useMiZona } from '../../features/zona/useMiZona';
import { diasHasta } from '../../lib/fechas';
import { colores, fuentes, medidas, tabular } from '../../lib/tokens';

const CON_RESULTADO = new Set(['JUGADA', 'WALKOVER', 'ABANDONO']);

export default function Zona() {
  const { perfil } = useSesion();
  const consulta = useMiZona();
  if (!perfil) return null;

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top']}>
      <ScrollView
        contentContainerStyle={estilos.contenido}
        refreshControl={
          <RefreshControl
            refreshing={consulta.isRefetching}
            onRefresh={() => {
              consulta.refetch();
            }}
          />
        }
      >
        <EncabezadoCircuito />
        {consulta.isPending && <Text style={estilos.aviso}>Cargando tu zona…</Text>}
        {consulta.error && <ErrorDeCarga error={consulta.error} que="tu zona" />}
        {consulta.data &&
          (consulta.data.zona ? (
            <Contenido zona={consulta.data.zona} jugadorId={perfil.jugador.id} />
          ) : (
            <Text style={estilos.aviso}>
              Todavía no estás en ninguna zona. Cuando la organización confirme el sorteo de tu torneo, la vas a ver acá.
            </Text>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Contenido({ zona, jugadorId }: { zona: MiZona; jugadorId: number }) {
  const jugados = zona.partidos.filter((p) => CON_RESULTADO.has(p.estado)).length;
  const faltan = zona.partidos.length - jugados;

  return (
    <>
      <View style={estilos.titulo}>
        <View style={estilos.nombreZona}>
          <Text style={estilos.textoTitulo}>Zona {zona.grupo}</Text>
          <Text style={estilos.jugados}>
            {jugados} de {zona.partidos.length} jugados
          </Text>
        </View>
        {faltan > 0 && zona.vence && <Plazo vence={zona.vence} />}
      </View>
      <Text style={estilos.torneo}>{zona.nombre}</Text>

      <MatrizDeZona filas={zona.filas} partidos={zona.partidos} />
      <LeyendaDeZona />
      <View style={estilos.separador} />
      <PosicionesDeZona zona={zona} jugadorId={jugadorId} />
    </>
  );
}

// Lo único en rojo de la pantalla, y solo si quedan partidos: el plazo de la zona.
function Plazo({ vence }: { vence: string }) {
  const dias = diasHasta(vence);
  const texto = dias < 0 ? 'venció' : dias === 0 ? 'vence hoy' : `${dias} ${dias === 1 ? 'día' : 'días'}`;
  return (
    <View style={estilos.plazo} accessibilityLabel={`Plazo de la zona: ${texto}`}>
      <Text style={estilos.textoPlazo}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.blanco,
  },
  contenido: {
    paddingHorizontal: medidas.margen,
    paddingTop: 20,
    paddingBottom: 28,
    gap: 18,
  },
  aviso: {
    fontFamily: fuentes.sans[400],
    fontSize: 15,
    lineHeight: 22,
    color: colores.gris700,
  },
  titulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: -12,
  },
  nombreZona: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  textoTitulo: {
    fontFamily: fuentes.sans[600],
    fontSize: 26,
    letterSpacing: -0.8,
    color: colores.negro,
  },
  jugados: {
    fontFamily: fuentes.mono[400],
    fontSize: 13,
    color: colores.gris500,
    ...tabular,
  },
  torneo: {
    fontFamily: fuentes.sans[400],
    fontSize: 14,
    color: colores.gris500,
  },
  plazo: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colores.rojoLinea,
    borderRadius: 999,
  },
  textoPlazo: {
    fontFamily: fuentes.mono[500],
    fontSize: 12,
    color: colores.rojoTexto,
    ...tabular,
  },
  separador: {
    height: 1,
    backgroundColor: colores.linea,
  },
});
