import bcrypt from 'bcryptjs';
import type {
  DatosIngreso,
  DatosRecuperarContrasena,
  DatosRegistroOrganizacion,
  DatosRestablecerContrasena,
  RespuestaIngresoJugador,
  RespuestaRegistro,
} from '@setpoint/shared';
import { enviarCorreo } from '../../lib/correo';
import { prisma } from '../../lib/prisma';
import { slugDisponible } from '../../lib/slug';
import {
  firmarToken,
  firmarTokenRecuperacion,
  tokenRecuperacionValido,
  usuarioDeTokenRecuperacion,
} from '../../lib/token';
import { ErrorHttp } from '../../middleware/errores';

const COSTO_BCRYPT = 10;

export async function registrarOrganizacion(datos: DatosRegistroOrganizacion): Promise<RespuestaRegistro> {
  const passwordHash = await bcrypt.hash(datos.contrasena, COSTO_BCRYPT);

  const organizacion = await prisma.$transaction(async (tx) => {
    const existente = await tx.usuario.findUnique({ where: { email: datos.email } });
    if (existente) throw new ErrorHttp(409, 'EMAIL_EN_USO');

    const slug = await slugDisponible(tx, datos.organizacion);

    return tx.organizacion.create({
      data: {
        nombre: datos.organizacion,
        slug,
        // El ranking es opcional: se arranca con torneos sueltos y se activa después (07-configurabilidad §1).
        usaRanking: false,
        admins: {
          create: {
            usuario: {
              create: {
                email: datos.email,
                passwordHash,
                nombre: datos.nombre,
                // El formulario pide un solo campo "Tu nombre" y apellido es obligatorio en el schema.
                apellido: '',
              },
            },
          },
        },
      },
      include: { admins: { include: { usuario: true } } },
    });
  });

  const usuario = organizacion.admins[0].usuario;

  return {
    token: firmarToken(usuario.id),
    usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre },
    organizacion: { id: organizacion.id, nombre: organizacion.nombre, slug: organizacion.slug },
  };
}

// Se compara contra este hash cuando el email no existe, para que la respuesta tarde lo mismo
// y no delate qué emails están registrados.
const HASH_DE_RELLENO = bcrypt.hashSync('contrasena-de-relleno', COSTO_BCRYPT);

// Lo comparten los dos ingresos, el de la web y el de la app.
async function usuarioConCredenciales(datos: DatosIngreso) {
  const usuario = await prisma.usuario.findUnique({ where: { email: datos.email } });

  const contrasenaCorrecta = await bcrypt.compare(datos.contrasena, usuario?.passwordHash ?? HASH_DE_RELLENO);
  // Mismo error para email inexistente y contraseña incorrecta.
  if (!usuario || !contrasenaCorrecta) throw new ErrorHttp(401, 'CREDENCIALES_INVALIDAS');

  return usuario;
}

export async function ingresar(datos: DatosIngreso): Promise<RespuestaRegistro> {
  const usuario = await usuarioConCredenciales(datos);

  // Si administra varias, entra a la más antigua: docs/decisiones/002-organizacion-al-ingresar.md
  const administra = await prisma.adminOrganizacion.findFirst({
    where: { usuarioId: usuario.id },
    orderBy: { creadoEn: 'asc' },
    include: { organizacion: true },
  });
  if (!administra) throw new ErrorHttp(403, 'SIN_ORGANIZACION');
  const { organizacion } = administra;

  return {
    token: firmarToken(usuario.id),
    usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre },
    organizacion: { id: organizacion.id, nombre: organizacion.nombre, slug: organizacion.slug },
  };
}

// Ingreso del jugador en la app (decisión 039). Devuelve todos los circuitos en los que juega;
// si hay más de uno, elige en la app (decisión 040). Quien solo administra entra por la web.
export async function ingresarJugador(datos: DatosIngreso): Promise<RespuestaIngresoJugador> {
  const usuario = await usuarioConCredenciales(datos);

  // Los dados de baja del padrón no cuentan: ya no juegan en ese circuito.
  const jugadores = await prisma.jugador.findMany({
    where: { usuarioId: usuario.id, activo: true },
    orderBy: { creadoEn: 'asc' },
    include: { organizacion: true, categoria: true },
  });
  if (jugadores.length === 0) throw new ErrorHttp(403, 'SIN_PERFIL_DE_JUGADOR');

  return {
    token: firmarToken(usuario.id),
    usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre },
    perfiles: jugadores.map((j) => ({
      jugador: {
        id: j.id,
        nombre: j.nombre,
        apellido: j.apellido,
        categoria: j.categoria && { id: j.categoria.id, nombre: j.categoria.nombre },
      },
      organizacion: { id: j.organizacion.id, nombre: j.organizacion.nombre, slug: j.organizacion.slug },
    })),
  };
}

const WEB_URL = process.env.WEB_URL ?? 'http://localhost:5173';

// No dice si el email existe: responde igual en los dos casos y el mail se manda sin esperarlo,
// para que la respuesta tarde lo mismo.
export async function pedirRecuperacion(datos: DatosRecuperarContrasena) {
  const usuario = await prisma.usuario.findUnique({ where: { email: datos.email } });
  if (!usuario) return;

  const token = firmarTokenRecuperacion(usuario.id, usuario.passwordHash);
  const link = `${WEB_URL}/restablecer-contrasena?token=${encodeURIComponent(token)}`;

  void enviarCorreo({
    para: usuario.email,
    asunto: 'Elegí una contraseña nueva',
    texto: [
      `Hola, ${usuario.nombre}:`,
      '',
      'Pediste cambiar la contraseña de tu cuenta de SetPoint. Entrá a este link para elegir una nueva:',
      '',
      link,
      '',
      'El link vale por una hora y sirve una sola vez. Si no fuiste vos, no hagas nada: tu contraseña sigue siendo la misma.',
    ].join('\n'),
  }).catch((error) => console.error('No se pudo mandar el mail de recuperación', error));
}

export async function restablecerContrasena(datos: DatosRestablecerContrasena) {
  const usuarioId = usuarioDeTokenRecuperacion(datos.token);
  const usuario = usuarioId === null ? null : await prisma.usuario.findUnique({ where: { id: usuarioId } });

  // Mismo error para link vencido, ya usado o inventado.
  if (!usuario || !tokenRecuperacionValido(datos.token, usuario.passwordHash)) {
    throw new ErrorHttp(400, 'LINK_INVALIDO');
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { passwordHash: await bcrypt.hash(datos.contrasena, COSTO_BCRYPT) },
  });
}
