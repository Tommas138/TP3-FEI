// Cuándo juego (F11): docs/pantallas/jugador/cuando-juego.html. La vista principal durante el
// torneo (04-flujo-jugador §7): el próximo partido, lo que falta coordinar y el resto.
import type { MisPartidos } from '@setpoint/shared';
import { useEffect } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EncabezadoCircuito } from '../../features/auth/EncabezadoCircuito';
import { ErrorDeCarga } from '../../features/auth/ErrorDeCarga';
import { programarRecordatorios } from '../../features/avisos/recordatorios';
import { agruparPartidos } from '../../features/partidos/agrupar';
import { OtrosPartidos } from '../../features/partidos/OtrosPartidos';
import { SinCoordinar } from '../../features/partidos/SinCoordinar';
import { TarjetaProximo } from '../../features/partidos/TarjetaProximo';
import { useMisPartidos } from '../../features/partidos/useMisPartidos';
import { colores, fuentes, medidas, radios, tabular } from '../../lib/tokens';

export default function CuandoJuego() {
  const consulta = useMisPartidos();
  const partidos = consulta.data?.partidos?.partidos;

  // Cada vez que llegan los partidos, los recordatorios quedan con las fechas de ahora.
  useEffect(() => {
    if (partidos) programarRecordatorios(partidos);
  }, [partidos]);

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
        <View style={estilos.encabezado}>
          <EncabezadoCircuito />
          {consulta.data?.partidos?.torneos.length === 1 && (
            <View style={estilos.torneo}>
              <Text style={estilos.textoTorneo} numberOfLines={1}>
                {consulta.data.partidos.torneos[0]}
              </Text>
            </View>
          )}
        </View>
        {consulta.isPending && <Text style={estilos.aviso}>Cargando tus partidos…</Text>}
        {consulta.error && <ErrorDeCarga error={consulta.error} que="tus partidos" />}
        {consulta.data &&
          (consulta.data.partidos ? (
            <Contenido datos={consulta.data.partidos} />
          ) : (
            <Text style={estilos.aviso}>
              Todavía no estás en ningún torneo en juego. Cuando se confirme el sorteo, tus partidos aparecen acá.
            </Text>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Contenido({ datos }: { datos: MisPartidos }) {
  const { proximo, sinCoordinar, resto, porJugar } = agruparPartidos(datos.partidos);

  return (
    <>
      {proximo ? (
        <TarjetaProximo partido={proximo} />
      ) : (
        <Text style={estilos.aviso}>No tenés ningún partido con fecha acordada.</Text>
      )}

      {sinCoordinar.length > 0 && (
        <>
          <View style={estilos.subtitulo}>
            <Text style={estilos.textoSubtitulo}>Te falta coordinar</Text>
            <Text style={estilos.cantidad}>
              {sinCoordinar.length} de {porJugar}
            </Text>
          </View>
          {sinCoordinar.map((p, i) => (
            <SinCoordinar key={p.id} partido={p} urgente={i === 0} />
          ))}
        </>
      )}

      {resto.length > 0 && <OtrosPartidos partidos={resto} />}
    </>
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
    gap: 20,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  torneo: {
    flexShrink: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colores.linea,
    borderRadius: radios.chip,
  },
  textoTorneo: {
    fontFamily: fuentes.mono[500],
    fontSize: 12,
    color: colores.gris500,
  },
  aviso: {
    fontFamily: fuentes.sans[400],
    fontSize: 15,
    lineHeight: 22,
    color: colores.gris700,
  },
  subtitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 2,
    marginBottom: -6,
  },
  textoSubtitulo: {
    fontFamily: fuentes.sans[600],
    fontSize: 20,
    letterSpacing: -0.4,
    color: colores.negro,
  },
  cantidad: {
    fontFamily: fuentes.mono[500],
    fontSize: 13,
    color: colores.gris500,
    ...tabular,
  },
});
