import { z } from 'zod';

// Mismo mínimo que LARGO_MINIMO_CONTRASENA en el formulario de registro.
export const LARGO_MINIMO_CONTRASENA = 8;

export const registroOrganizacionSchema = z.object(
  {
    organizacion: z
      .string({ error: 'Escribí el nombre del circuito' })
      .trim()
      .min(2, 'Escribí el nombre del circuito')
      .max(80),
    nombre: z.string({ error: 'Escribí tu nombre' }).trim().min(1, 'Escribí tu nombre').max(80),
    email: z
      .string({ error: 'Escribí tu email' })
      .trim()
      .toLowerCase()
      .pipe(z.email('El email no es válido')),
    contrasena: z
      .string({ error: 'Escribí una contraseña' })
      .min(LARGO_MINIMO_CONTRASENA, `La contraseña tiene que tener al menos ${LARGO_MINIMO_CONTRASENA} caracteres`),
  },
  { error: 'Faltan los datos del registro' },
);

export type DatosRegistroOrganizacion = z.infer<typeof registroOrganizacionSchema>;

export const respuestaRegistroSchema = z.object({
  token: z.string(),
  usuario: z.object({ id: z.number(), email: z.string(), nombre: z.string() }),
  organizacion: z.object({ id: z.number(), nombre: z.string(), slug: z.string() }),
});

export type RespuestaRegistro = z.infer<typeof respuestaRegistroSchema>;

// Email y contraseña. Lo usan los dos ingresos: el de la web, que responde con la misma forma que
// el registro, y el del jugador en la app (respuestaIngresoJugadorSchema).
export const ingresoSchema = z.object(
  {
    email: z
      .string({ error: 'Escribí tu email' })
      .trim()
      .toLowerCase()
      .pipe(z.email('El email no es válido')),
    contrasena: z.string({ error: 'Escribí tu contraseña' }).min(1, 'Escribí tu contraseña'),
  },
  { error: 'Faltan el email y la contraseña' },
);

export type DatosIngreso = z.infer<typeof ingresoSchema>;

// Un circuito en el que juega quien ingresa desde la app, con su perfil del padrón. Sin datos de
// contacto: es lo que queda guardado en el celular.
export const perfilDeJugadorSchema = z.object({
  jugador: z.object({
    id: z.number(),
    nombre: z.string(),
    apellido: z.string(),
    categoria: z.object({ id: z.number(), nombre: z.string() }).nullable(),
  }),
  organizacion: z.object({ id: z.number(), nombre: z.string(), slug: z.string() }),
});

export type PerfilDeJugador = z.infer<typeof perfilDeJugadorSchema>;

// Ingreso del jugador en la app (decisión 039): un perfil por circuito en el que juega, del más
// viejo al más nuevo. Si hay más de uno, elige el jugador (decisión 040).
export const respuestaIngresoJugadorSchema = z.object({
  token: z.string(),
  usuario: z.object({ id: z.number(), email: z.string(), nombre: z.string() }),
  perfiles: z.array(perfilDeJugadorSchema).min(1),
});

export type RespuestaIngresoJugador = z.infer<typeof respuestaIngresoJugadorSchema>;

// Pedido del link para elegir una contraseña nueva.
export const recuperarContrasenaSchema = z.object(
  {
    email: z
      .string({ error: 'Escribí tu email' })
      .trim()
      .toLowerCase()
      .pipe(z.email('El email no es válido')),
  },
  { error: 'Falta el email' },
);

export type DatosRecuperarContrasena = z.infer<typeof recuperarContrasenaSchema>;

// Lo que manda la pantalla a la que lleva ese link.
export const restablecerContrasenaSchema = z.object(
  {
    token: z.string({ error: 'Falta el link' }).min(1, 'Falta el link'),
    contrasena: z
      .string({ error: 'Escribí una contraseña' })
      .min(LARGO_MINIMO_CONTRASENA, `La contraseña tiene que tener al menos ${LARGO_MINIMO_CONTRASENA} caracteres`),
  },
  { error: 'Faltan el link y la contraseña' },
);

export type DatosRestablecerContrasena = z.infer<typeof restablecerContrasenaSchema>;
