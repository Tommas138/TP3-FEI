// Ranking del circuito en la app (F09, F11): docs/pantallas/jugador/ranking.html. Usa la ruta
// pública y le suma lo que depende de la sesión: tu tarjeta y tu fila.
import type { RankingPublico } from '@setpoint/shared';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip } from '../components/Chip';
import { EncabezadoCircuito } from '../features/auth/EncabezadoCircuito';
import { useSesion } from '../features/auth/SesionProvider';
import { FilaRanking } from '../features/ranking/FilaRanking';
import { TarjetaPropia } from '../features/ranking/TarjetaPropia';
import { useRanking } from '../features/ranking/useRanking';
import { ErrorApi } from '../lib/api';
import { colores, fuentes, medidas, tabular } from '../lib/tokens';

function mensajeDeError(error: Error) {
  if (error instanceof ErrorApi && error.codigo === 'SIN_CONEXION') return 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.';
  return 'No pudimos cargar el ranking. Probá de nuevo en unos minutos.';
}

export default function Ranking() {
  const { perfil } = useSesion();
  const ranking = useRanking(perfil?.organizacion.slug ?? '');
  if (!perfil) return null;

  return (
    <SafeAreaView style={estilos.pantalla}>
      <ScrollView
        contentContainerStyle={estilos.contenido}
        refreshControl={
          <RefreshControl
            refreshing={ranking.isRefetching}
            onRefresh={() => {
              ranking.refetch();
            }}
          />
        }
      >
        <EncabezadoCircuito />
        {ranking.isPending && <Text style={estilos.aviso}>Cargando el ranking…</Text>}
        {ranking.error && <Text style={estilos.aviso}>{mensajeDeError(ranking.error)}</Text>}
        {ranking.data &&
          (ranking.data.usaRanking ? (
            <Tabla
              // Al cambiar de circuito arranca de nuevo, en tu categoría de ese circuito.
              key={perfil.jugador.id}
              ranking={ranking.data}
              jugadorId={perfil.jugador.id}
              categoriaPropiaId={perfil.jugador.categoria?.id ?? null}
            />
          ) : (
            <Text style={estilos.aviso}>Este circuito no lleva ranking.</Text>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

type PropsTabla = {
  ranking: RankingPublico;
  jugadorId: number;
  categoriaPropiaId: number | null;
};

function Tabla({ ranking, jugadorId, categoriaPropiaId }: PropsTabla) {
  const [categoriaId, setCategoriaId] = useState(categoriaPropiaId);
  const [abierta, setAbierta] = useState<number | null>(null);

  // Abre en tu categoría. Si no tenés, o si cambiaste de circuito, en la primera que tiene jugadores.
  const categoria =
    ranking.categorias.find((c) => c.id === categoriaId) ??
    ranking.categorias.find((c) => c.filas.length > 0) ??
    ranking.categorias[0];

  if (!categoria) return <Text style={estilos.aviso}>Este circuito todavía no cargó sus categorías.</Text>;

  const filaPropia = categoria.filas.find((f) => f.jugadorId === jugadorId);

  return (
    <>
      <View style={estilos.titulo}>
        <Text style={estilos.textoTitulo}>Ranking</Text>
        <View style={estilos.chips}>
          {ranking.categorias.map((c) => (
            <Chip key={c.id} texto={c.nombre} activo={c.id === categoria.id} onPress={() => setCategoriaId(c.id)} />
          ))}
        </View>
      </View>

      {filaPropia && (
        <TarjetaPropia
          fila={filaPropia}
          jugadores={categoria.filas.length}
          torneosDelCalendario={ranking.torneosDelCalendario}
        />
      )}

      <View style={estilos.subtitulo}>
        <Text style={estilos.textoSubtitulo}>Toda la tabla</Text>
        <Text style={estilos.cantidad}>
          {categoria.filas.length} {categoria.filas.length === 1 ? 'jugador' : 'jugadores'}
        </Text>
      </View>

      {categoria.filas.length === 0 ? (
        <Text style={estilos.ayuda}>Todavía no hay jugadores en {categoria.nombre}.</Text>
      ) : (
        <>
          <View>
            {categoria.filas.map((fila) => (
              <FilaRanking
                key={fila.jugadorId}
                fila={fila}
                torneosDelCalendario={ranking.torneosDelCalendario}
                propia={fila.jugadorId === jugadorId}
                abierta={abierta === fila.jugadorId}
                alTocar={() => setAbierta(abierta === fila.jugadorId ? null : fila.jugadorId)}
              />
            ))}
          </View>
          <Text style={estilos.ayuda}>Tocá a cualquiera para ver sus puntos de cada torneo del calendario.</Text>
        </>
      )}
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
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  textoTitulo: {
    fontFamily: fuentes.sans[600],
    fontSize: 30,
    letterSpacing: -1,
    color: colores.negro,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  subtitulo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 2,
  },
  textoSubtitulo: {
    fontFamily: fuentes.sans[600],
    fontSize: 20,
    letterSpacing: -0.4,
    color: colores.negro,
  },
  cantidad: {
    fontFamily: fuentes.mono[400],
    fontSize: 15,
    color: colores.gris500,
    ...tabular,
  },
  ayuda: {
    fontFamily: fuentes.sans[400],
    fontSize: 15,
    lineHeight: 22,
    color: colores.gris500,
  },
});
