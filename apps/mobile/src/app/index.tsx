// Pantalla de prueba de la base de la app: comprueba que llega a la API, que @setpoint/shared se
// resuelve desde Metro y que las fuentes cargan. Se reemplaza por el ingreso del jugador.
import { respuestaSaludSchema } from '@setpoint/shared';
import { useQuery } from '@tanstack/react-query';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorApi, pedir, urlDeLaApi } from '../lib/api';
import { colores, fuentes, medidas, radios, tabular } from '../lib/tokens';

// El parse es lo que obliga a Metro a resolver @setpoint/shared: un import de tipos se borra al compilar.
async function consultarSalud() {
  return respuestaSaludSchema.parse(await pedir('GET', '/api/salud'));
}

function explicarError(error: unknown): string {
  if (!(error instanceof ErrorApi)) return 'En esa dirección responde algo que no es la API de SetPoint.';
  if (error.codigo === 'SIN_API_URL') {
    return 'Falta EXPO_PUBLIC_API_URL en apps/mobile/.env. Después reiniciá con npx expo start --clear.';
  }
  if (error.codigo === 'SIN_CONEXION') {
    return 'Fijate que la API esté corriendo y que el celular esté en la misma Wi-Fi que la notebook.';
  }
  return `La API respondió con un error: ${error.codigo}.`;
}

export default function PruebaDeConexion() {
  // Sin reintentos: con el corte de 10 segundos de pedir(), tres reintentos tardarían más de medio minuto en avisar.
  const salud = useQuery({ queryKey: ['salud'], queryFn: consultarSalud, retry: false });

  let estado: string;
  let detalle: string | null = null;
  if (salud.isFetching) {
    estado = 'Conectando…';
  } else if (salud.isSuccess) {
    estado = `Conectada · ${salud.data.servicio}`;
  } else {
    estado = 'No llego a la API';
    detalle = explicarError(salud.error);
  }

  return (
    <SafeAreaView style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <View style={estilos.encabezado}>
          <Text style={estilos.titulo}>SetPoint</Text>
          <Text style={estilos.ayuda}>Prueba de la base de la app. Se reemplaza con el ingreso.</Text>
        </View>

        <View style={estilos.tarjeta}>
          <Text style={estilos.rotuloOscuro}>API</Text>
          <Text style={estilos.url}>{urlDeLaApi() ?? 'sin configurar'}</Text>
          <Text style={estilos.estado}>{estado}</Text>
          {detalle && <Text style={estilos.detalle}>{detalle}</Text>}
        </View>

        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Fuentes</Text>
          <Text style={[estilos.muestra, { fontFamily: fuentes.sans[400] }]}>Instrument Sans 400</Text>
          <Text style={[estilos.muestra, { fontFamily: fuentes.sans[500] }]}>Instrument Sans 500</Text>
          <Text style={[estilos.muestra, { fontFamily: fuentes.sans[600] }]}>Instrument Sans 600</Text>
          <Text style={[estilos.muestra, { fontFamily: fuentes.sans[700] }]}>Instrument Sans 700</Text>
          <Text style={[estilos.muestraMono, { fontFamily: fuentes.mono[400] }]}>6-4 3-6 10-8</Text>
          <Text style={[estilos.muestraMono, { fontFamily: fuentes.mono[500] }]}>sáb 14 · 10:00</Text>
          <Text style={[estilos.muestraMono, { fontFamily: fuentes.mono[600] }]}>$45.000 · 165 puntos</Text>
        </View>

        <Pressable
          style={({ pressed }) => [estilos.boton, pressed && estilos.botonApretado]}
          onPress={() => salud.refetch()}
          disabled={salud.isFetching}
        >
          <Text style={estilos.textoBoton}>Probar de nuevo</Text>
        </Pressable>
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
    padding: medidas.margen,
    gap: 20,
  },
  encabezado: {
    gap: 6,
  },
  titulo: {
    fontFamily: fuentes.sans[600],
    fontSize: 34,
    letterSpacing: -1,
    color: colores.negro,
  },
  ayuda: {
    fontFamily: fuentes.sans[400],
    fontSize: 16,
    lineHeight: 22,
    color: colores.gris500,
  },
  tarjeta: {
    backgroundColor: colores.negro,
    borderRadius: radios.superficie,
    padding: 20,
    gap: 8,
  },
  rotuloOscuro: {
    fontFamily: fuentes.sans[500],
    fontSize: 15,
    color: colores.gris400,
  },
  url: {
    fontFamily: fuentes.mono[500],
    fontSize: 17,
    color: colores.blanco,
    ...tabular,
  },
  estado: {
    fontFamily: fuentes.sans[600],
    fontSize: 20,
    color: colores.blanco,
    marginTop: 8,
  },
  detalle: {
    fontFamily: fuentes.sans[400],
    fontSize: 15,
    lineHeight: 21,
    color: colores.gris400,
  },
  seccion: {
    gap: 8,
  },
  tituloSeccion: {
    fontFamily: fuentes.sans[600],
    fontSize: 20,
    letterSpacing: -0.5,
    color: colores.negro,
  },
  muestra: {
    fontSize: 17,
    color: colores.negro,
  },
  muestraMono: {
    fontSize: 17,
    color: colores.negro,
    ...tabular,
  },
  boton: {
    height: medidas.toque,
    borderRadius: radios.control,
    backgroundColor: colores.negro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonApretado: {
    backgroundColor: colores.carbon,
  },
  textoBoton: {
    fontFamily: fuentes.sans[600],
    fontSize: 17,
    color: colores.blanco,
  },
});
