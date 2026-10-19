// Ingreso del jugador: el panel "Volver a entrar" de docs/pantallas/jugador/cuenta-e-ingreso.html.
// Sin "No me acuerdo", "Ver torneos abiertos" ni "Registrar una organización": el link de la
// recuperación abre la web, los torneos abiertos son F12 y las organizaciones entran por la web.
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View, type TextInputInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton } from '../components/Boton';
import { Campo } from '../components/Campo';
import { Logo } from '../components/Logo';
import { useIngreso } from '../features/auth/useIngreso';
import { ErrorApi } from '../lib/api';
import { colores, fuentes, medidas, radios } from '../lib/tokens';

function mensajeDe(error: Error | null): string | null {
  if (!error) return null;
  if (!(error instanceof ErrorApi)) return 'Algo salió mal. Probá de nuevo.';

  switch (error.codigo) {
    // Un email mal escrito también es "no son correctos", como en la web.
    case 'CREDENCIALES_INVALIDAS':
    case 'DATOS_INVALIDOS':
      return 'El email o la contraseña no son correctos.';
    case 'SIN_PERFIL_DE_JUGADOR':
      return 'Tu cuenta no juega en ningún circuito. Si administrás una organización, entrá desde la web.';
    case 'SIN_CONEXION':
      return 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.';
    case 'SIN_API_URL':
      return 'Falta EXPO_PUBLIC_API_URL en apps/mobile/.env.';
    default:
      return 'No pudimos ingresar. Probá de nuevo en unos minutos.';
  }
}

export default function Ingresar() {
  const ingreso = useIngreso();
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const campoContrasena = useRef<TextInputInstance>(null);

  const error = mensajeDe(ingreso.error);
  const enviar = () => ingreso.mutate({ email, contrasena });

  return (
    <SafeAreaView style={estilos.pantalla}>
      <KeyboardAvoidingView style={estilos.pantalla} behavior="padding">
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
          <View style={estilos.marca}>
            <Logo />
            <Text style={estilos.nombreMarca}>SetPoint</Text>
          </View>

          <View style={estilos.encabezado}>
            <Text style={estilos.titulo}>Ingresar</Text>
            <Text style={estilos.bajada}>Para jugadores. Las organizaciones entran desde la web.</Text>
          </View>

          <Campo
            rotulo="Email"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => campoContrasena.current?.focus()}
          />
          <Campo
            ref={campoContrasena}
            rotulo="Contraseña"
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={enviar}
          />

          {error && (
            <View accessibilityRole="alert" style={estilos.error}>
              <Text style={estilos.textoError}>{error}</Text>
            </View>
          )}

          <Boton
            texto={ingreso.isPending ? 'Ingresando…' : 'Ingresar'}
            variante="organizador"
            onPress={enviar}
            disabled={ingreso.isPending}
          />

          <View style={estilos.sinCuenta}>
            <Text style={estilos.tituloSinCuenta}>¿Todavía no tenés cuenta?</Text>
            <Text style={estilos.texto}>
              Las cuentas de jugador se crean al inscribirse a un torneo, no antes. Pedile el link a tu organización.
            </Text>
          </View>

          <Text style={[estilos.texto, estilos.pie]}>
            Mirar el ranking y los cuadros no necesita cuenta: se abren desde el link que comparte tu organización.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.blanco,
  },
  contenido: {
    flexGrow: 1,
    paddingHorizontal: medidas.margen,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 20,
  },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  nombreMarca: {
    fontFamily: fuentes.sans[600],
    fontSize: 15,
    color: colores.negro,
  },
  encabezado: {
    gap: 8,
    paddingTop: 8,
  },
  titulo: {
    fontFamily: fuentes.sans[600],
    fontSize: 28,
    letterSpacing: -0.9,
    color: colores.negro,
  },
  bajada: {
    fontFamily: fuentes.sans[400],
    fontSize: 16,
    lineHeight: 23,
    color: colores.gris500,
  },
  // El rojo es solo para vencimientos (design.md §3): el error va en gris sobre fondo.
  error: {
    backgroundColor: colores.fondo,
    borderRadius: radios.control,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textoError: {
    fontFamily: fuentes.sans[500],
    fontSize: 15,
    lineHeight: 21,
    color: colores.gris700,
  },
  sinCuenta: {
    borderWidth: 1,
    borderColor: colores.linea,
    borderRadius: radios.tarjeta,
    padding: 16,
    gap: 10,
  },
  tituloSinCuenta: {
    fontFamily: fuentes.sans[600],
    fontSize: 16,
    color: colores.negro,
  },
  texto: {
    fontFamily: fuentes.sans[400],
    fontSize: 15,
    lineHeight: 22,
    color: colores.gris500,
  },
  pie: {
    marginTop: 'auto',
    textAlign: 'center',
  },
});
