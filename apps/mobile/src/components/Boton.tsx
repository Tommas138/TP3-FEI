import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { colores, fuentes, medidas, radios } from '../lib/tokens';

// Los mismos nombres que en la web (design.md §6). "organizador" es el negro, que la app también usa
// para acciones como Ingresar.
type Variante = 'organizador' | 'secundario';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  texto: string;
  variante?: Variante;
};

export function Boton({ texto, variante = 'secundario', disabled, ...props }: Props) {
  const oscuro = variante === 'organizador';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        estilos.base,
        oscuro ? estilos.organizador : estilos.secundario,
        pressed && (oscuro ? estilos.organizadorApretado : estilos.secundarioApretado),
        disabled && estilos.deshabilitado,
      ]}
      {...props}
    >
      <Text style={[estilos.texto, oscuro ? estilos.textoOrganizador : estilos.textoSecundario]}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    borderRadius: radios.control,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  organizador: {
    height: medidas.toque,
    backgroundColor: colores.negro,
  },
  organizadorApretado: {
    backgroundColor: colores.carbon,
  },
  secundario: {
    height: medidas.toqueSecundario,
    borderWidth: 1,
    borderColor: colores.linea,
  },
  secundarioApretado: {
    backgroundColor: colores.fondo,
  },
  deshabilitado: {
    opacity: 0.4,
  },
  texto: {
    fontSize: 17,
  },
  textoOrganizador: {
    fontFamily: fuentes.sans[600],
    color: colores.blanco,
  },
  textoSecundario: {
    fontFamily: fuentes.sans[500],
    color: colores.negro,
  },
});
