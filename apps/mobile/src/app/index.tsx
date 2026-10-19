// Inicio provisorio: muestra con quién y en qué circuito se entró. Lo reemplaza el ranking (paso 3).
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EncabezadoCircuito } from '../features/auth/EncabezadoCircuito';
import { useSesion } from '../features/auth/SesionProvider';
import { colores, fuentes, medidas, radios } from '../lib/tokens';

export default function Inicio() {
  const { perfil } = useSesion();
  if (!perfil) return null;

  const { jugador, organizacion } = perfil;

  return (
    <SafeAreaView style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <EncabezadoCircuito />

        <View style={estilos.saludo}>
          <Text style={estilos.titulo}>Hola, {jugador.nombre}</Text>
          <Text style={estilos.texto}>
            {jugador.categoria
              ? `Jugás en ${jugador.categoria.nombre}, en ${organizacion.nombre}.`
              : `Jugás en ${organizacion.nombre}.`}
          </Text>
        </View>

        <View style={estilos.aviso}>
          <Text style={estilos.textoAviso}>Inicio provisorio: acá va a estar el ranking.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  saludo: {
    gap: 8,
  },
  titulo: {
    fontFamily: fuentes.sans[600],
    fontSize: 34,
    letterSpacing: -1,
    color: colores.negro,
  },
  texto: {
    fontFamily: fuentes.sans[400],
    fontSize: 17,
    lineHeight: 24,
    color: colores.gris700,
  },
  aviso: {
    backgroundColor: colores.fondo,
    borderRadius: radios.tarjeta,
    padding: 16,
  },
  textoAviso: {
    fontFamily: fuentes.sans[400],
    fontSize: 15,
    lineHeight: 22,
    color: colores.gris500,
  },
});
