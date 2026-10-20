import { ErrorHttp } from '../middleware/errores';
import { prisma } from './prisma';

// Devuelve el id de la organización si el usuario la administra.
export async function organizacionAdministrada(slug: string, usuarioId: number) {
  const organizacion = await prisma.organizacion.findUnique({
    where: { slug },
    select: { id: true, admins: { where: { usuarioId }, select: { id: true } } },
  });
  if (!organizacion) throw new ErrorHttp(404, 'ORGANIZACION_NO_ENCONTRADA');
  if (organizacion.admins.length === 0) throw new ErrorHttp(403, 'SIN_PERMISO');
  return organizacion.id;
}

// El perfil de jugador del usuario en la organización, si juega en ella y no está de baja.
// Es el permiso de las rutas de /api/jugador (decisión 044).
export async function perfilDeJugador(slug: string, usuarioId: number) {
  const organizacion = await prisma.organizacion.findUnique({
    where: { slug },
    select: { id: true, jugadores: { where: { usuarioId, activo: true }, select: { id: true } } },
  });
  if (!organizacion) throw new ErrorHttp(404, 'ORGANIZACION_NO_ENCONTRADA');
  const [jugador] = organizacion.jugadores;
  if (!jugador) throw new ErrorHttp(403, 'SIN_PERFIL_DE_JUGADOR');
  return { organizacionId: organizacion.id, jugadorId: jugador.id };
}
