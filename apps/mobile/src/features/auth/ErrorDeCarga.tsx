import { StyleSheet, Text, View } from 'react-native';
import { Boton } from '../../components/Boton';
import { ErrorApi } from '../../lib/api';
import { colores, fuentes } from '../../lib/tokens';
import { useSesion } from './SesionProvider';

// El error de una pantalla que pide login. Si el token venció o el jugador ya no está en el
// circuito, la sesión guardada no sirve: se ofrece volver a ingresar.
export function ErrorDeCarga({ error, que }: { error: Error; que: string }) {
  const { cerrarSesion } = useSesion();
  const codigo = error instanceof ErrorApi ? error.codigo : null;

  if (codigo === 'NO_AUTENTICADO' || codigo === 'SIN_PERFIL_DE_JUGADOR') {
    return (
      <View style={estilos.bloque}>
        <Text style={estilos.texto}>
          {codigo === 'NO_AUTENTICADO' ? 'Tu sesión venció.' : 'Ya no figurás en el padrón de este circuito.'} Volvé a ingresar.
        </Text>
        <Boton texto="Volver a ingresar" variante="organizador" onPress={() => cerrarSesion()} />
      </View>
    );
  }

  return (
    <Text style={estilos.texto}>
      {codigo === 'SIN_CONEXION'
        ? 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.'
        : `No pudimos cargar ${que}. Probá de nuevo en unos minutos.`}
    </Text>
  );
}

const estilos = StyleSheet.create({
  bloque: {
    gap: 14,
  },
  texto: {
    fontFamily: fuentes.sans[400],
    fontSize: 15,
    lineHeight: 22,
    color: colores.gris700,
  },
});
